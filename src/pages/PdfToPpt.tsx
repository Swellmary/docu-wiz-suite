import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const tool = tools.find((t) => t.id === "pdf-to-ppt")!;

const PdfToPpt = () => {
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
      const zip = new JSZip();

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const base64 = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`slide_${i}.png`, base64, { base64: true });
        setProgress(Math.round((i / total) * 100));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${files[0].name.replace(".pdf", "")}_slides.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${total} slides as images!`);
      setFiles([]);
    } catch {
      toast.error("Failed to convert PDF to slides.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Each PDF page is exported as a high-resolution PNG slide image.
      </p>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Converting slides…" progress={progress} />}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Download className="h-4 w-4" /> Convert to Slides & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PdfToPpt;
