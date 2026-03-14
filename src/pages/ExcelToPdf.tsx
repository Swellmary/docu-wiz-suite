import { useState } from "react";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "excel-to-pdf")!;

const ExcelToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(10);
    try {
      const buffer = await files[0].arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      setProgress(30);

      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 9;
      const lineHeight = fontSize * 1.6;
      const margin = 40;
      const pageWidth = 842; // landscape A4
      const pageHeight = 595;

      const sheets = workbook.SheetNames;
      for (let s = 0; s < sheets.length; s++) {
        const sheet = workbook.Sheets[sheets[s]];
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        let page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        // Sheet title
        page.drawText(sheets[s], { x: margin, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
        y -= 24;

        for (let r = 0; r < data.length; r++) {
          if (y < margin) {
            page = doc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          const row = data[r] || [];
          const colWidth = (pageWidth - margin * 2) / Math.max(row.length, 1);
          row.forEach((cell, c) => {
            const text = String(cell ?? "").substring(0, 40);
            const x = margin + c * colWidth;
            page.drawText(text, {
              x, y, size: fontSize,
              font: r === 0 ? boldFont : font,
              color: rgb(0, 0, 0),
            });
          });
          y -= lineHeight;
        }

        setProgress(30 + Math.round(((s + 1) / sheets.length) * 60));
      }

      setProgress(95);
      const pdfBytes = await doc.save();
      downloadPdf(pdfBytes, files[0].name.replace(/\.xlsx?$/i, ".pdf"));
      toast.success("Spreadsheet converted to PDF!");
      setFiles([]);
    } catch {
      toast.error("Failed to convert spreadsheet.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".xls,.xlsx,.csv" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Converting spreadsheet…" progress={progress} />}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Download className="h-4 w-4" /> Convert to PDF & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ExcelToPdf;
