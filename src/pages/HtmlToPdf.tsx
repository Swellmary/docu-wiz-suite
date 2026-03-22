import { useState, useCallback, useRef } from "react";
import { Download, Upload, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";
import DOMPurify from "dompurify";

const tool = tools.find((t) => t.id === "html-to-pdf")!;

const HtmlToPdf = () => {
  const [htmlCode, setHtmlCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setError("Please upload an HTML file (.html or .htm)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setHtmlCode(e.target?.result as string);
    reader.readAsText(file);
  }, []);

  const convert = async () => {
    if (!htmlCode.trim()) { setError("Please provide HTML content"); return; }
    setError(null);
    setProcessing(true);
    setProgress(0);
    setResultUrl(null);
    try {
      const sanitized = DOMPurify.sanitize(htmlCode, { WHOLE_DOCUMENT: true, ADD_TAGS: ["style", "link"] });
      const blob = await htmlStringToPdfBlob(sanitized, setProgress);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Conversion failed. Please check your HTML.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <Tabs defaultValue="paste" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste"><Code className="h-4 w-4 mr-1" /> Paste HTML</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <Textarea
            placeholder="Paste your HTML code here..."
            className="min-h-[250px] font-mono text-sm"
            value={htmlCode}
            onChange={(e) => { setHtmlCode(e.target.value); setError(null); }}
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
            <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold">{isDragging ? "Drop file here" : "Click or drag HTML file here"}</p>
            <p className="text-sm text-muted-foreground">.html, .htm • Max 50MB</p>
          </div>
          {htmlCode && <p className="mt-2 text-sm text-muted-foreground">HTML loaded ({htmlCode.length.toLocaleString()} characters)</p>}
        </TabsContent>
      </Tabs>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}

      {processing && <ProcessingProgress label="Converting HTML to PDF…" progress={progress} />}

      <div className="flex gap-3 mt-4">
        <Button onClick={convert} disabled={processing || !htmlCode.trim()} className="gap-2">
          Convert to PDF
        </Button>
        {resultUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={resultUrl} download="converted.pdf"><Download className="h-4 w-4" /> Download PDF</a>
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

export default HtmlToPdf;
