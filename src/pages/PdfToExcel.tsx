import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const tool = tools.find((t) => t.id === "pdf-to-excel")!;

const PdfToExcel = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    try {
      const buffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total = pdf.numPages;
      const rows: string[][] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const lines: string[] = [];
        let lastY: number | null = null;
        let line = "";

        for (const item of content.items as any[]) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            lines.push(line.trim());
            line = "";
          }
          line += item.str + "\t";
          lastY = item.transform[5];
        }
        if (line.trim()) lines.push(line.trim());
        rows.push([`Page ${i}`]);
        lines.forEach((l) => rows.push(l.split("\t").filter(Boolean)));
        rows.push([]);
        setProgress(Math.round((i / total) * 100));
      }

      const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(".pdf", ".csv");
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF data extracted to CSV!");
      setFiles([]);
    } catch {
      toast.error("Failed to extract data from PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Extracts text content as CSV. Works best with table-based PDFs.
      </p>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Extracting data…" progress={progress} />}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Download className="h-4 w-4" /> Extract to CSV & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PdfToExcel;
