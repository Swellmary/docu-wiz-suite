import { useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "ppt-to-pdf")!;

const PptToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(10);
    try {
      const buffer = await files[0].arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const doc = await PDFDocument.create();
      setProgress(30);

      // Extract images from pptx (they're stored in ppt/media/)
      const mediaFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith("ppt/media/") && /\.(png|jpg|jpeg)$/i.test(name)
      );

      if (mediaFiles.length === 0) {
        // Fallback: extract text from slides
        const slideFiles = Object.keys(zip.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
          .sort();

        for (let i = 0; i < slideFiles.length; i++) {
          const xml = await zip.files[slideFiles[i]].async("text");
          const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const page = doc.addPage([960, 540]);
          const font = await doc.embedFont("Helvetica" as any);
          const lines = text.match(/.{1,100}/g) || ["(empty slide)"];
          let y = 500;
          for (const line of lines.slice(0, 30)) {
            page.drawText(line, { x: 40, y, size: 12, font });
            y -= 16;
            if (y < 40) break;
          }
          setProgress(30 + Math.round(((i + 1) / slideFiles.length) * 60));
        }
      } else {
        for (let i = 0; i < mediaFiles.length; i++) {
          const imgBytes = await zip.files[mediaFiles[i]].async("uint8array");
          const isJpg = /\.jpe?g$/i.test(mediaFiles[i]);
          const img = isJpg
            ? await doc.embedJpg(imgBytes)
            : await doc.embedPng(imgBytes);
          const page = doc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          setProgress(30 + Math.round(((i + 1) / mediaFiles.length) * 60));
        }
      }

      setProgress(95);
      const pdfBytes = await doc.save();
      downloadPdf(pdfBytes, files[0].name.replace(/\.pptx?$/i, ".pdf"));
      toast.success("Presentation converted to PDF!");
      setFiles([]);
    } catch {
      toast.error("Failed to convert presentation.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Extracts slide content and images from PowerPoint files.
      </p>
      <FileUpload accept=".ppt,.pptx" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Converting presentation…" progress={progress} />}
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

export default PptToPdf;
