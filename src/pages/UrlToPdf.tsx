import { useState } from "react";
import { Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";

const tool = tools.find((t) => t.id === "url-to-pdf")!;

const UrlToPdf = () => {
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    let target = url.trim();
    if (!target) { setError("Please enter a URL"); return; }
    if (!target.startsWith("http://") && !target.startsWith("https://")) target = "https://" + target;
    try { new URL(target); } catch { setError("Invalid URL"); return; }

    setError(null);
    setProcessing(true);
    setProgress(0);
    setResultUrl(null);

    try {
      setProgress(10);
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      const html = await res.text();
      setProgress(30);

      // Inject a <base> tag so relative URLs resolve
      const baseTag = `<base href="${target}">`;
      const enriched = html.includes("<head>") ? html.replace("<head>", `<head>${baseTag}`) : `${baseTag}${html}`;

      const blob = await htmlStringToPdfBlob(enriched, (p) => setProgress(30 + p * 0.7));
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not convert this URL. Some sites block cross-origin access.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && convert()}
          />
        </div>
        <Button onClick={convert} disabled={processing || !url.trim()}>Convert</Button>
      </div>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      {processing && <ProcessingProgress label="Fetching and converting page…" progress={progress} />}

      {resultUrl && (
        <div className="mt-4 space-y-4">
          <Button variant="outline" className="gap-2" asChild>
            <a href={resultUrl} download="webpage.pdf"><Download className="h-4 w-4" /> Download PDF</a>
          </Button>
          <div className="rounded-lg border overflow-hidden">
            <iframe src={resultUrl} className="w-full h-[500px]" title="PDF Preview" />
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default UrlToPdf;
