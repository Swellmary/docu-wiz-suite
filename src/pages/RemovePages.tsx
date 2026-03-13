import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { renderPdfThumbnails, PageThumbnail } from "@/lib/pdf-preview";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import PdfPageGrid from "@/components/PdfPageGrid";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "remove-pages")!;

const RemovePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    setFiles([file]);
    try {
      const thumbs = await renderPdfThumbnails(file, 0.3);
      setThumbnails(thumbs);
      setSelectedPages(new Set());
    } catch {
      toast.error("Could not preview PDF");
    }
  }, []);

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      next.has(pageNum) ? next.delete(pageNum) : next.add(pageNum);
      return next;
    });
  }, []);

  const handleRemove = async () => {
    if (!files.length || selectedPages.size === 0) return;
    setProcessing(true);
    setProgress(0);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();

      if (selectedPages.size >= total) {
        toast.error("Cannot remove all pages");
        setProcessing(false);
        return;
      }

      const keepIndices = Array.from({ length: total }, (_, i) => i).filter(
        (i) => !selectedPages.has(i + 1)
      );

      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(doc, keepIndices);
      copied.forEach((p, i) => {
        newDoc.addPage(p);
        setProgress(((i + 1) / keepIndices.length) * 90);
      });
      const pdfBytes = await newDoc.save();
      setProgress(100);
      downloadPdf(pdfBytes, `trimmed_${files[0].name}`);
      toast.success(`Removed ${selectedPages.size} pages!`);
      setFiles([]);
      setThumbnails([]);
    } catch {
      toast.error("Failed to remove pages.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        files={files}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={() => { setFiles([]); setThumbnails([]); }}
      />

      {thumbnails.length > 0 && !processing && (
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Click pages to mark for deletion ({selectedPages.size} selected)
          </p>
          <PdfPageGrid
            pages={thumbnails}
            selectable
            selectedPages={selectedPages}
            onTogglePage={togglePage}
          />
        </div>
      )}

      {processing && <ProcessingProgress label="Removing pages…" progress={progress} />}

      {thumbnails.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={handleRemove}
            disabled={selectedPages.size === 0}
            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
            Delete {selectedPages.size} Pages & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default RemovePages;
