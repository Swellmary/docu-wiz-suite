import { useState, useCallback, useRef } from "react";
import { Download, Upload, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolPageLayout from "@/components/ToolPageLayout";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";
import { htmlStringToPdfBlob } from "@/lib/html-to-pdf-util";
import Papa from "papaparse";

const tool = tools.find((t) => t.id === "csv-to-pdf")!;

function csvToHtmlTable(csvText: string): string {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
  if (!parsed.data.length) throw new Error("No data found");
  const [header, ...rows] = parsed.data;

  const styles = `
    body { font-family: 'Segoe UI', sans-serif; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #2563eb; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    h2 { color: #1e3a5f; margin-bottom: 12px; }
  `;

  return `<html><head><style>${styles}</style></head><body>
    <h2>CSV Data — ${rows.length} rows</h2>
    <table>
      <thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </body></html>`;
}

const CsvToPdf = () => {
  const [csvText, setCsvText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { setError("Please upload a CSV file"); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(e.target?.result as string);
    reader.readAsText(file);
  }, []);

  const convert = async () => {
    if (!csvText.trim()) { setError("Please provide CSV data"); return; }
    setError(null); setProcessing(true); setProgress(0); setResultUrl(null);
    try {
      const html = csvToHtmlTable(csvText);
      const blob = await htmlStringToPdfBlob(html, setProgress);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Failed to parse CSV. Check your data format.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload CSV</TabsTrigger>
          <TabsTrigger value="paste"><Table2 className="h-4 w-4 mr-1" /> Paste Data</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold">{isDragging ? "Drop CSV here" : "Click or drag CSV file here"}</p>
          </div>
          {csvText && <p className="mt-2 text-sm text-muted-foreground">CSV loaded ({csvText.split("\n").length} lines)</p>}
        </TabsContent>

        <TabsContent value="paste">
          <Textarea
            placeholder="name,email,age&#10;John,john@example.com,30"
            className="min-h-[200px] font-mono text-sm"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setError(null); }}
          />
        </TabsContent>
      </Tabs>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      {processing && <ProcessingProgress label="Converting CSV to PDF…" progress={progress} />}

      <div className="flex gap-3 mt-4">
        <Button onClick={convert} disabled={processing || !csvText.trim()} className="gap-2">Convert to PDF</Button>
        {resultUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={resultUrl} download="csv-data.pdf"><Download className="h-4 w-4" /> Download PDF</a>
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

export default CsvToPdf;
