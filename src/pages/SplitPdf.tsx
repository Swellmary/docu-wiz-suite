import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "split")!;

const SplitPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleSplit = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();

      for (let i = 0; i < total; i++) {
        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(doc, [i]);
        newDoc.addPage(page);
        const pdfBytes = await newDoc.save();
        downloadPdf(pdfBytes, `page_${i + 1}.pdf`);
      }
      toast.success(`Split into ${total} pages!`);
    } catch {
      toast.error("Failed to split PDF.");
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
          <Button size="lg" disabled={processing} onClick={handleSplit} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {processing ? "Splitting…" : "Split & Download All Pages"}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default SplitPdf;
