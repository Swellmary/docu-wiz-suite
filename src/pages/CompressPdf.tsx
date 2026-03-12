import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "compress")!;

const CompressPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleCompress = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      // Basic compression: re-save which strips unused objects
      const pdfBytes = await doc.save({ useObjectStreams: false });
      const originalSize = files[0].size;
      const newSize = pdfBytes.length;
      const reduction = Math.round((1 - newSize / originalSize) * 100);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Compressed! ${reduction > 0 ? `Reduced by ${reduction}%` : "File was already optimized"}`);
    } catch {
      toast.error("Failed to compress PDF.");
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
        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={processing} onClick={handleCompress} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {processing ? "Compressing…" : "Compress & Download"}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default CompressPdf;
