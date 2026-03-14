import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const tool = tools.find((t) => t.id === "preview")!;

const PdfPreview = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!files.length) { setPages([]); setTotalPages(0); return; }
    let cancelled = false;
    const render = async () => {
      setLoading(true);
      setProgress(0);
      try {
        const buffer = await files[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        setTotalPages(pdf.numPages);
        const imgs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: zoom });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          imgs.push(canvas.toDataURL("image/jpeg", 0.85));
          setProgress(Math.round((i / pdf.numPages) * 100));
        }
        if (!cancelled) {
          setPages(imgs);
          setCurrentPage(1);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [files, zoom]);

  return (
    <ToolPageLayout tool={tool}>
      {!files.length && (
        <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      )}
      {loading && <ProcessingProgress label="Rendering pages…" progress={progress} />}
      {pages.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (v >= 1 && v <= totalPages) setCurrentPage(v);
                }}
                className="w-16 h-8 text-center"
              />
              <span className="text-muted-foreground">/ {totalPages}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-6 w-px bg-border" />
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-6 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setPages([]); }}>
              Change file
            </Button>
          </div>
          <div className="flex justify-center overflow-auto rounded-lg border bg-muted/30 p-4">
            <img src={pages[currentPage - 1]} alt={`Page ${currentPage}`} className="shadow-lg rounded" />
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PdfPreview;
