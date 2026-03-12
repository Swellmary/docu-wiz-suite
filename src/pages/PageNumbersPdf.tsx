import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "page-numbers")!;

const PageNumbersPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleAdd = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      pages.forEach((page, i) => {
        const { width } = page.getSize();
        const text = `${i + 1}`;
        const fontSize = 10;
        const tw = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - tw) / 2,
          y: 20,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `numbered_${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Page numbers added!");
    } catch {
      toast.error("Failed to add page numbers.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {files.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={processing} onClick={handleAdd} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {processing ? "Processing…" : "Add Numbers & Download"}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PageNumbersPdf;
