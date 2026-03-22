import { useState } from "react";
import { Download, Github, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";
import { marked } from "marked";
import DOMPurify from "dompurify";

const tool = tools.find((t) => t.id === "github-to-pdf")!;

interface RepoFile {
  name: string;
  path: string;
  type: string;
  download_url: string | null;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\/|\/$/g, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.text();
}

async function findMarkdownFiles(owner: string, repo: string): Promise<{ path: string; url: string }[]> {
  const mdFiles: { path: string; url: string }[] = [];

  // Fetch root README
  const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  try {
    const res = await fetch(readmeUrl);
    if (res.ok) {
      const data = await res.json();
      mdFiles.push({ path: data.path, url: data.download_url });
    }
  } catch { /* ignore */ }

  // Scan for docs/ folder and other markdown files
  const scanPaths = ["", "docs"];
  for (const dir of scanPaths) {
    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dir}`;
      const res = await fetch(apiUrl);
      if (!res.ok) continue;
      const files: RepoFile[] = await res.json();
      for (const f of files) {
        if (
          f.type === "file" &&
          /\.(md|markdown)$/i.test(f.name) &&
          f.download_url &&
          !mdFiles.some((m) => m.path === f.path)
        ) {
          mdFiles.push({ path: f.path, url: f.download_url });
        }
      }
    } catch { /* ignore */ }
  }

  return mdFiles;
}

const pdfStyles = `
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; line-height: 1.7; }
  .pdf-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
  .pdf-header h1 { font-size: 28px; margin: 0 0 4px; }
  .pdf-header .meta { font-size: 12px; color: #6b7280; }
  .toc { margin-bottom: 32px; }
  .toc h2 { font-size: 18px; margin-bottom: 8px; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { padding: 4px 0; font-size: 14px; color: #3b82f6; }
  .section-divider { border-top: 1px solid #e5e7eb; margin: 32px 0; padding-top: 8px; }
  .section-divider .file-path { font-size: 11px; color: #9ca3af; font-family: monospace; }
  h1 { font-size: 26px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 24px 0 16px; }
  h2 { font-size: 22px; margin: 20px 0 12px; }
  h3 { font-size: 18px; margin: 16px 0 8px; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-family: 'Fira Code', 'Consolas', monospace; }
  pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
  pre code { background: none; padding: 0; color: inherit; }
  blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #6b7280; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  img { max-width: 100%; }
  a { color: #3b82f6; text-decoration: none; }
  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }
`;

const GithubToPdf = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  const convert = async () => {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setError("Please enter a valid GitHub repository URL (e.g. https://github.com/username/repo)");
      return;
    }

    setError(null);
    setProcessing(true);
    setProgress(0);
    setResultUrl(null);
    setFileCount(0);

    try {
      setProgress(10);
      const mdFiles = await findMarkdownFiles(parsed.owner, parsed.repo);

      if (mdFiles.length === 0) {
        throw new Error("Unable to access repository documentation.");
      }

      setFileCount(mdFiles.length);
      setProgress(25);

      // Fetch all markdown contents
      const contents: { path: string; md: string }[] = [];
      for (let i = 0; i < mdFiles.length; i++) {
        const text = await fetchText(mdFiles[i].url);
        contents.push({ path: mdFiles[i].path, md: text });
        setProgress(25 + (i / mdFiles.length) * 30);
      }

      setProgress(60);

      // Build HTML
      const now = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      const header = `
        <div class="pdf-header">
          <h1>${parsed.owner}/${parsed.repo}</h1>
          <div class="meta">${repoUrl.trim()}<br/>Generated: ${now}</div>
        </div>
      `;

      // TOC
      let toc = "";
      if (contents.length > 1) {
        toc = `<div class="toc"><h2>Table of Contents</h2><ul>`;
        for (const c of contents) {
          toc += `<li>📄 ${c.path}</li>`;
        }
        toc += `</ul></div>`;
      }

      // Sections
      let sections = "";
      for (const c of contents) {
        const rawHtml = await marked.parse(c.md);
        const safeHtml = DOMPurify.sanitize(rawHtml);
        sections += `
          <div class="section-divider">
            <div class="file-path">${c.path}</div>
          </div>
          ${safeHtml}
        `;
      }

      const fullHtml = `<html><head><style>${pdfStyles}</style></head><body>${header}${toc}${sections}</body></html>`;

      setProgress(70);
      const blob = await htmlStringToPdfBlob(fullHtml, (p) => setProgress(70 + p * 0.3));
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err?.message || "Unable to access repository documentation.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Paste GitHub Repository URL</label>
          <Input
            placeholder="https://github.com/username/repository"
            value={repoUrl}
            onChange={(e) => { setRepoUrl(e.target.value); setError(null); }}
            className="font-mono text-sm"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {processing && (
          <div className="space-y-2">
            <ProcessingProgress label="Fetching repository documentation…" progress={progress} />
            {fileCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Found {fileCount} documentation file{fileCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={convert} disabled={processing || !repoUrl.trim()} className="gap-2">
            <Github className="h-4 w-4" /> Generate PDF
          </Button>
          {resultUrl && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={resultUrl} download={`${parseGitHubUrl(repoUrl)?.repo || "repo"}-docs.pdf`}>
                <Download className="h-4 w-4" /> Download Repository PDF
              </a>
            </Button>
          )}
        </div>

        {resultUrl && (
          <div className="mt-6 rounded-lg border overflow-hidden">
            <iframe src={resultUrl} className="w-full h-[500px]" title="PDF Preview" />
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default GithubToPdf;
