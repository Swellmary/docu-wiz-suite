import { useState, useCallback, useRef } from "react";
import { Download, Upload, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";
import { marked } from "marked";
import DOMPurify from "dompurify";

const tool = tools.find((t) => t.id === "markdown-to-pdf")!;

const mdStyles = `
  body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.7; }
  h1 { font-size: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 24px 0 16px; }
  h2 { font-size: 22px; margin: 20px 0 12px; }
  h3 { font-size: 18px; margin: 16px 0 8px; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #6b7280; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  img { max-width: 100%; }
  a { color: #3b82f6; }
`;

const MarkdownToPdf = () => {
  const [mdText, setMdText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      setError("Please upload a Markdown file (.md)");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setMdText(e.target?.result as string);
    reader.readAsText(file);
  }, []);

  const convert = async () => {
    if (!mdText.trim()) { setError("Please provide Markdown content"); return; }
    setError(null);
    setProcessing(true);
    setProgress(0);
    setResultUrl(null);
    try {
      const rawHtml = await marked.parse(mdText);
      const safeHtml = DOMPurify.sanitize(rawHtml);
      const fullHtml = `<html><head><style>${mdStyles}</style></head><body>${safeHtml}</body></html>`;
      const blob = await htmlStringToPdfBlob(fullHtml, setProgress);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <Tabs defaultValue="paste" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste"><Type className="h-4 w-4 mr-1" /> Write Markdown</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <Textarea
            placeholder="# Hello World\n\nType your **Markdown** here..."
            className="min-h-[250px] font-mono text-sm"
            value={mdText}
            onChange={(e) => { setMdText(e.target.value); setError(null); }}
          />
        </TabsContent>

        <TabsContent value="upload">
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".md,.markdown" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold">{isDragging ? "Drop file here" : "Click or drag .md file here"}</p>
          </div>
          {mdText && <p className="mt-2 text-sm text-muted-foreground">Markdown loaded ({mdText.length.toLocaleString()} characters)</p>}
        </TabsContent>
      </Tabs>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      {processing && <ProcessingProgress label="Converting Markdown to PDF…" progress={progress} />}

      <div className="flex gap-3 mt-4">
        <Button onClick={convert} disabled={processing || !mdText.trim()} className="gap-2">Convert to PDF</Button>
        {resultUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={resultUrl} download="markdown.pdf"><Download className="h-4 w-4" /> Download PDF</a>
          </Button>
        )}
      </div>

      {resultUrl && (
        <div className="mt-6 rounded-lg border overflow-hidden">
          <iframe src={resultUrl} className="w-full h-[500px]" title="PDF Preview" />
        </div>
      )}
    </ToolPageLayout>
  );
};

export default MarkdownToPdf;
