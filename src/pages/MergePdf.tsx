import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { renderPdfThumbnails, PageThumbnail } from "@/lib/pdf-preview";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import PdfPageGrid from "@/components/PdfPageGrid";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "merge")!;

interface FileWithThumbnails {
  file: File;
  thumbnails: PageThumbnail[];
}

const MergePdf = () => {
  const [fileEntries, setFileEntries] = useState<FileWithThumbnails[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  const files = fileEntries.map((e) => e.file);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setLoadingThumbs(true);
    const entries: FileWithThumbnails[] = [];
    for (const file of newFiles) {
      try {
        const thumbnails = await renderPdfThumbnails(file, 0.3);
        entries.push({ file, thumbnails });
      } catch {
        toast.error(`Could not preview ${file.name}`);
      }
    }
    setFileEntries((prev) => [...prev, ...entries]);
    setLoadingThumbs(false);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFileEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMerge = async () => {
    if (fileEntries.length < 2) {
      toast.error("Please select at least 2 PDF files");
      return;
    }
    setProcessing(true);
    setProgress(0);
    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < fileEntries.length; i++) {
        const bytes = await fileEntries[i].file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        setProgress(((i + 1) / fileEntries.length) * 90);
      }
      const pdfBytes = await merged.save();
      setProgress(100);
      downloadPdf(pdfBytes, "merged.pdf");
      toast.success("PDFs merged successfully!");
      setFileEntries([]);
    } catch {
      toast.error("Failed to merge PDFs.");
    } finally {
      setProcessing(false);
    }
  };

  const allThumbnails = fileEntries.flatMap((entry, fileIdx) =>
    entry.thumbnails.map((t) => ({
      ...t,
      pageNumber: t.pageNumber,
      label: `${entry.file.name} - Page ${t.pageNumber}`,
    }))
  );

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        multiple
        files={files}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={handleRemoveFile}
      />

      {loadingThumbs && (
        <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
          Loading previews…
        </p>
      )}

      {allThumbnails.length > 0 && !processing && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Page Preview</h3>
          <PdfPageGrid pages={allThumbnails} />
        </div>
      )}

      {processing && <ProcessingProgress label="Merging PDFs…" progress={progress} />}

      {fileEntries.length >= 2 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={handleMerge}
            className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Merge & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default MergePdf;
