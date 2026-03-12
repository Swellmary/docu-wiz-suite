import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "merge")!;

const MergePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files");
      return;
    }
    setProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const pdfBytes = await merged.save();
      downloadPdf(pdfBytes, "merged.pdf");
      toast.success("PDFs merged successfully!");
    } catch {
      toast.error("Failed to merge PDFs. Make sure all files are valid.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        multiple
        files={files}
        onFilesSelected={(f) => setFiles((prev) => [...prev, ...f])}
        onRemoveFile={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
      />
      {files.length >= 2 && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            disabled={processing}
            onClick={handleMerge}
            className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {processing ? "Merging…" : "Merge & Download"}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default MergePdf;
