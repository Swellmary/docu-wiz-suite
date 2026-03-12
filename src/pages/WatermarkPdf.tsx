import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "watermark")!;

const WatermarkPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [processing, setProcessing] = useState(false);

  const handleWatermark = async () => {
    if (!files.length || !text.trim()) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.08;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.3,
          rotate: { type: "degrees" as const, angle: -45 },
        });
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked_${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Watermark added!");
    } catch {
      toast.error("Failed to add watermark.");
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
          <div className="mx-auto max-w-sm">
            <label className="mb-1.5 block text-sm font-medium">Watermark text</label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text" />
          </div>
          <div className="flex justify-center">
            <Button size="lg" disabled={processing || !text.trim()} onClick={handleWatermark} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {processing ? "Adding watermark…" : "Add Watermark & Download"}
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default WatermarkPdf;
