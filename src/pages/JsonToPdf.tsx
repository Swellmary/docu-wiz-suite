import { useState, useCallback, useRef } from "react";
import { Download, Upload, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";

const tool = tools.find((t) => t.id === "json-to-pdf")!;

function jsonToHtml(jsonStr: string): string {
  const data = JSON.parse(jsonStr);
  const styles = `
    body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; }
    .key { color: #2563eb; font-weight: 600; }
    .string { color: #16a34a; }
    .number { color: #dc2626; }
    .bool { color: #9333ea; }
    .null { color: #6b7280; font-style: italic; }
    .block { margin-left: 20px; border-left: 2px solid #e5e7eb; padding-left: 12px; margin-bottom: 8px; }
    .item { margin-bottom: 4px; }
    h2 { color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  `;

  function render(val: unknown, depth = 0): string {
    if (val === null) return `<span class="null">null</span>`;
    if (typeof val === "boolean") return `<span class="bool">${val}</span>`;
    if (typeof val === "number") return `<span class="number">${val}</span>`;
    if (typeof val === "string") return `<span class="string">"${val.replace(/</g, "&lt;")}"</span>`;
    if (Array.isArray(val)) {
      if (!val.length) return "[ ]";
      return `<div class="block">${val.map((v, i) => `<div class="item"><span class="key">[${i}]</span> ${render(v, depth + 1)}</div>`).join("")}</div>`;
    }
    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      if (!entries.length) return "{ }";
      return `<div class="block">${entries.map(([k, v]) => `<div class="item"><span class="key">${k}:</span> ${render(v, depth + 1)}</div>`).join("")}</div>`;
    }
    return String(val);
  }

  return `<html><head><style>${styles}</style></head><body><h2>JSON Data</h2>${render(data)}</body></html>`;
}

const JsonToPdf = () => {
  const [jsonText, setJsonText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) { setError("Please upload a JSON file"); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setJsonText(e.target?.result as string);
    reader.readAsText(file);
  }, []);

  const convert = async () => {
    if (!jsonText.trim()) { setError("Please provide JSON data"); return; }
    setError(null); setProcessing(true); setProgress(0); setResultUrl(null);
    try {
      const html = jsonToHtml(jsonText);
      const blob = await htmlStringToPdfBlob(html, setProgress);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Invalid JSON. Please check your data.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <Tabs defaultValue="paste" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste"><Braces className="h-4 w-4 mr-1" /> Paste JSON</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <Textarea
            placeholder='{ "name": "John", "age": 30 }'
            className="min-h-[250px] font-mono text-sm"
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(null); }}
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
            <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold">{isDragging ? "Drop JSON here" : "Click or drag JSON file here"}</p>
          </div>
          {jsonText && <p className="mt-2 text-sm text-muted-foreground">JSON loaded ({jsonText.length.toLocaleString()} characters)</p>}
        </TabsContent>
      </Tabs>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      {processing && <ProcessingProgress label="Converting JSON to PDF…" progress={progress} />}

      <div className="flex gap-3 mt-4">
        <Button onClick={convert} disabled={processing || !jsonText.trim()} className="gap-2">Convert to PDF</Button>
        {resultUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={resultUrl} download="json-data.pdf"><Download className="h-4 w-4" /> Download PDF</a>
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

export default JsonToPdf;
