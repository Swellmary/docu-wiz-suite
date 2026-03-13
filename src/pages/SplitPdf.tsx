import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { renderPdfThumbnails, PageThumbnail } from "@/lib/pdf-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import PdfPageGrid from "@/components/PdfPageGrid";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "split")!;

const SplitPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<"all" | "select">("all");

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

  const handleSplit = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();
      const pagesToSplit = splitMode === "select" && selectedPages.size > 0
        ? Array.from(selectedPages).sort((a, b) => a - b)
        : Array.from({ length: total }, (_, i) => i + 1);

      for (let i = 0; i < pagesToSplit.length; i++) {
        const pageIdx = pagesToSplit[i] - 1;
        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(doc, [pageIdx]);
        newDoc.addPage(page);
        const pdfBytes = await newDoc.save();
        downloadPdf(pdfBytes, `page_${pagesToSplit[i]}.pdf`);
        setProgress(((i + 1) / pagesToSplit.length) * 100);
      }
      toast.success(`Split into ${pagesToSplit.length} pages!`);
      setFiles([]);
      setThumbnails([]);
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
        onFilesSelected={handleFilesSelected}
        onRemoveFile={() => { setFiles([]); setThumbnails([]); }}
      />

      {thumbnails.length > 0 && !processing && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={splitMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSplitMode("all")}
            >
              Split All Pages
            </Button>
            <Button
              variant={splitMode === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setSplitMode("select")}
            >
              Select Pages
            </Button>
          </div>

          <PdfPageGrid
            pages={thumbnails}
            selectable={splitMode === "select"}
            selectedPages={selectedPages}
            onTogglePage={togglePage}
          />
        </div>
      )}

      {processing && <ProcessingProgress label="Splitting PDF…" progress={progress} />}

      {thumbnails.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={handleSplit}
            disabled={splitMode === "select" && selectedPages.size === 0}
            className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            {splitMode === "all" ? "Split All & Download" : `Split ${selectedPages.size} Pages`}
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default SplitPdf;
