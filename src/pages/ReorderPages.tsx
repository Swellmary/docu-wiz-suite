import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, GripVertical } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { renderPdfThumbnails, PageThumbnail } from "@/lib/pdf-preview";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import PdfPageGrid from "@/components/PdfPageGrid";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "organize")!;

const ReorderPages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    setFiles([file]);
    try {
      const thumbs = await renderPdfThumbnails(file, 0.3);
      setPages(thumbs);
    } catch {
      toast.error("Could not preview PDF");
    }
  }, []);

  const handleReorder = useCallback((reordered: PageThumbnail[]) => {
    setPages(reordered);
  }, []);

  const handleSave = async () => {
    if (!files.length || !pages.length) return;
    setProcessing(true);
    setProgress(0);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const newDoc = await PDFDocument.create();
      const indices = pages.map((p) => p.pageNumber - 1);
      const copied = await newDoc.copyPages(doc, indices);
      copied.forEach((p, i) => {
        newDoc.addPage(p);
        setProgress(((i + 1) / indices.length) * 90);
      });
      const pdfBytes = await newDoc.save();
      setProgress(100);
      downloadPdf(pdfBytes, `reordered_${files[0].name}`);
      toast.success("Pages reordered successfully!");
      setFiles([]);
      setPages([]);
    } catch {
      toast.error("Failed to reorder pages.");
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
        onRemoveFile={() => { setFiles([]); setPages([]); }}
      />

      {pages.length > 0 && !processing && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <span>Drag and drop pages to reorder them</span>
          </div>
          <PdfPageGrid pages={pages} draggable onReorder={handleReorder} />
        </div>
      )}

      {processing && <ProcessingProgress label="Reordering pages…" progress={progress} />}

      {pages.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={handleSave}
            className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Save & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ReorderPages;
