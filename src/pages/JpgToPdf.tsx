import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "jpg-to-pdf")!;

const JpgToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const doc = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const isJpg = file.type === "image/jpeg";
        const img = isJpg
          ? await doc.embedJpg(bytes)
          : await doc.embedPng(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await doc.save();
      downloadPdf(pdfBytes, "images.pdf");
      toast.success("Images converted to PDF!");
    } catch {
      toast.error("Failed to convert images. Make sure files are valid JPG or PNG.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".jpg,.jpeg,.png"
        multiple
        files={files}
        onFilesSelected={(f) => setFiles((prev) => [...prev, ...f])}
        onRemoveFile={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
      />
      {files.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={processing} onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {processing ? "Converting…" : "Convert to PDF & Download"}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default JpgToPdf;
