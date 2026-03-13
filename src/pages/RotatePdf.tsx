import { useState, useCallback } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import { Download, RotateCw } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { renderPdfThumbnails, PageThumbnail } from "@/lib/pdf-preview";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import PdfPageGrid from "@/components/PdfPageGrid";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "rotate")!;

const RotatePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [globalRotation, setGlobalRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    setFiles([file]);
    try {
      const thumbs = await renderPdfThumbnails(file, 0.3);
      setThumbnails(thumbs);
      setRotations(new Map());
    } catch {
      toast.error("Could not preview PDF");
    }
  }, []);

  const rotatePage = useCallback((pageNum: number) => {
    setRotations((prev) => {
      const next = new Map(prev);
      next.set(pageNum, ((next.get(pageNum) ?? 0) + 90) % 360);
      return next;
    });
  }, []);

  const rotateAll = useCallback(() => {
    setRotations((prev) => {
      const next = new Map(prev);
      thumbnails.forEach((t) => {
        next.set(t.pageNumber, ((next.get(t.pageNumber) ?? 0) + globalRotation) % 360);
      });
      return next;
    });
  }, [thumbnails, globalRotation]);

  const handleRotate = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const docPages = doc.getPages();
      docPages.forEach((page, i) => {
        const rot = rotations.get(i + 1) ?? 0;
        if (rot) {
          page.setRotation(degrees(page.getRotation().angle + rot));
        }
        setProgress(((i + 1) / docPages.length) * 90);
      });
      const pdfBytes = await doc.save();
      setProgress(100);
      downloadPdf(pdfBytes, `rotated_${files[0].name}`);
      toast.success("PDF rotated successfully!");
      setFiles([]);
      setThumbnails([]);
    } catch {
      toast.error("Failed to rotate PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const hasRotations = Array.from(rotations.values()).some((r) => r !== 0);

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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Rotate all:</span>
            {[90, 180, 270].map((deg) => (
              <Button
                key={deg}
                variant={globalRotation === deg ? "default" : "outline"}
                size="sm"
                onClick={() => setGlobalRotation(deg)}
                className="gap-1"
              >
                <RotateCw className="h-3 w-3" /> {deg}°
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={rotateAll}>
              Apply to All
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Or click the rotate icon on individual pages
          </p>
          <PdfPageGrid
            pages={thumbnails}
            showRotate
            rotations={rotations}
            onRotate={rotatePage}
          />
        </div>
      )}

      {processing && <ProcessingProgress label="Rotating pages…" progress={progress} />}

      {thumbnails.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            disabled={!hasRotations}
            onClick={handleRotate}
            className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Rotate & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default RotatePdf;
