import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2, RotateCw } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "rotate")!;

const RotatePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);

  const handleRotate = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      doc.getPages().forEach((page) => {
        page.setRotation(degrees(page.getRotation().angle + rotation));
      });
      const pdfBytes = await doc.save();
      downloadPdf(pdfBytes, `rotated_${files[0].name}`);
      toast.success("PDF rotated successfully!");
    } catch {
      toast.error("Failed to rotate PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        files={files}
        onFilesSelected={(f) => setFiles(f.slice(0, 1))}
        onRemoveFile={() => setFiles([])}
      />
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-medium">Rotation:</span>
            {[90, 180, 270].map((deg) => (
              <Button
                key={deg}
                variant={rotation === deg ? "default" : "outline"}
                size="sm"
                onClick={() => setRotation(deg)}
                className="gap-1"
              >
                <RotateCw className="h-3 w-3" /> {deg}°
              </Button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button size="lg" disabled={processing} onClick={handleRotate} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {processing ? "Rotating…" : "Rotate & Download"}
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default RotatePdf;
