import { useState } from "react";
import mammoth from "mammoth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "word-to-pdf")!;

const WordToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(20);
    try {
      const buffer = await files[0].arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      setProgress(50);

      const text = result.value;
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 50;
      const lineHeight = fontSize * 1.4;
      const pageWidth = 595;
      const pageHeight = 842;
      const maxWidth = pageWidth - margin * 2;

      const lines: string[] = [];
      for (const paragraph of text.split("\n")) {
        if (!paragraph.trim()) { lines.push(""); continue; }
        const words = paragraph.split(" ");
        let currentLine = "";
        for (const word of words) {
          const test = currentLine ? `${currentLine} ${word}` : word;
          if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = test;
          }
        }
        if (currentLine) lines.push(currentLine);
      }

      setProgress(70);
      let page = doc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (const line of lines) {
        if (y < margin) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        if (line) {
          page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        }
        y -= lineHeight;
      }

      setProgress(90);
      const pdfBytes = await doc.save();
      downloadPdf(pdfBytes, files[0].name.replace(/\.docx?$/i, ".pdf"));
      toast.success("Word document converted to PDF!");
      setFiles([]);
    } catch {
      toast.error("Failed to convert Word document.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".doc,.docx" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Converting document…" progress={progress} />}
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

export default WordToPdf;
