import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { toast } from "sonner";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const tool = tools.find((t) => t.id === "pdf-to-jpg")!;

const PdfToJpg = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setPreviews([]);
    try {
      const buffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total = pdf.numPages;
      const zip = new JSZip();
      const imgs: string[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        imgs.push(dataUrl);

        const base64 = dataUrl.split(",")[1];
        zip.file(`page_${i}.jpg`, base64, { base64: true });
        setProgress(Math.round((i / total) * 100));
      }

      setPreviews(imgs.slice(0, 6));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${files[0].name.replace(".pdf", "")}_images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Converted ${total} pages to JPG!`);
      setFiles([]);
    } catch {
      toast.error("Failed to convert PDF to images.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Converting pages…" progress={progress} />}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <img key={i} src={src} alt={`Page ${i + 1}`} className="rounded-lg border" />
          ))}
        </div>
      )}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <ImageIcon className="h-4 w-4" /> Convert to JPG & Download ZIP
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PdfToJpg;
