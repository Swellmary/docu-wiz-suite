import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "remove-pages")!;

const RemovePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("1");
  const [processing, setProcessing] = useState(false);

  const handleRemove = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();
      const toRemove = new Set(pages.split(",").map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < total));

      const keepIndices = Array.from({ length: total }, (_, i) => i).filter(i => !toRemove.has(i));
      if (!keepIndices.length) {
        toast.error("Cannot remove all pages");
        setProcessing(false);
        return;
      }

      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(doc, keepIndices);
      copied.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trimmed_${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Removed ${toRemove.size} pages!`);
    } catch {
      toast.error("Failed to remove pages.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="mx-auto max-w-sm">
            <label className="mb-1.5 block text-sm font-medium">Pages to remove (comma-separated)</label>
            <Input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1, 3, 5" />
          </div>
          <div className="flex justify-center">
            <Button size="lg" disabled={processing} onClick={handleRemove} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {processing ? "Processing…" : "Remove Pages & Download"}
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default RemovePages;
