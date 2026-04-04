import { useState } from "react";
import { PDFDocument, PDFName, PDFStream, PDFRawStream, PDFRef } from "pdf-lib";
import { toast } from "sonner";
import { Download, Loader2, Shrink, FileDown } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { Slider } from "@/components/ui/slider";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "compress")!;

type CompressionLevel = "low" | "medium" | "high" | "maximum";

const levelConfig: Record<CompressionLevel, { label: string; description: string; quality: number }> = {
  low: { label: "Low", description: "Best quality, minimal size reduction", quality: 0.9 },
  medium: { label: "Medium", description: "Good balance of quality and size", quality: 0.7 },
  high: { label: "High", description: "Smaller file, some quality loss", quality: 0.5 },
  maximum: { label: "Maximum", description: "Smallest file, noticeable quality loss", quality: 0.3 },
};

const levels: CompressionLevel[] = ["low", "medium", "high", "maximum"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function downscaleImage(imageBytes: Uint8Array, mimeType: string, quality: number): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const blob = new Blob([imageBytes as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = quality < 0.5 ? quality + 0.3 : quality < 0.8 ? quality + 0.1 : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => {
          if (b) {
            b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
          } else {
            resolve(imageBytes);
          }
        },
        "image/jpeg",
        quality
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(imageBytes);
    };
    img.src = url;
  });
}

const CompressPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [levelIndex, setLevelIndex] = useState(1); // default medium
  const [result, setResult] = useState<{ bytes: Uint8Array; originalSize: number; newSize: number; filename: string } | null>(null);

  const level = levels[levelIndex];
  const config = levelConfig[level];

  const handleCompress = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const originalSize = file.size;
      setProgress(10);

      // Strategy 1: Structural optimization (copy pages, strip metadata, object streams)
      const original = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const structuralDoc = await PDFDocument.create();
      const pageCount = original.getPageCount();
      const pages = await structuralDoc.copyPages(original, original.getPageIndices());
      pages.forEach((p) => structuralDoc.addPage(p));
      
      // Strip metadata
      structuralDoc.setTitle("");
      structuralDoc.setAuthor("");
      structuralDoc.setSubject("");
      structuralDoc.setKeywords([]);
      structuralDoc.setProducer("");
      structuralDoc.setCreator("");

      const structuralBytes = await structuralDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      setProgress(40);

      let bestBytes = structuralBytes;

      // Strategy 2: For medium+, also try render-to-JPEG approach and pick smaller
      if (level !== "low") {
        try {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

          const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes) });
          const pdfDoc = await loadingTask.promise;

          // Scale and JPEG quality vary by level
          const renderScale = level === "maximum" ? 0.75 : level === "high" ? 1.0 : 1.2;
          const jpegQuality = level === "maximum" ? 0.2 : level === "high" ? 0.4 : 0.6;

          const compressed = await PDFDocument.create();

          for (let i = 0; i < pageCount; i++) {
            const page = await pdfDoc.getPage(i + 1);
            const viewport = page.getViewport({ scale: renderScale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport }).promise;

            const blob = await new Promise<Blob>((res) =>
              canvas.toBlob((b) => res(b!), "image/jpeg", jpegQuality)
            );
            const imgBytes = new Uint8Array(await blob.arrayBuffer());
            const jpgImage = await compressed.embedJpg(imgBytes);

            const origPage = original.getPage(i);
            const { width, height } = origPage.getSize();
            const newPage = compressed.addPage([width, height]);
            newPage.drawImage(jpgImage, { x: 0, y: 0, width, height });

            setProgress(40 + Math.round(((i + 1) / pageCount) * 45));
          }

          compressed.setTitle("");
          compressed.setAuthor("");
          compressed.setSubject("");
          compressed.setKeywords([]);
          compressed.setProducer("");
          compressed.setCreator("");

          const renderedBytes = await compressed.save({
            useObjectStreams: true,
            addDefaultPage: false,
          });

          pdfDoc.destroy();

          // Only use rendered version if it's actually smaller
          if (renderedBytes.length < bestBytes.length) {
            bestBytes = renderedBytes;
          }
        } catch (renderErr) {
          console.warn("Render compression failed, using structural:", renderErr);
        }
      }

      setProgress(95);

      // Final safety: never return a file larger than the original
      if (bestBytes.length >= originalSize) {
        // Just use the raw original bytes as-is
        bestBytes = new Uint8Array(bytes);
      }

      setProgress(100);

      const newSize = bestBytes.length;
      setResult({
        bytes: bestBytes,
        originalSize,
        newSize,
        filename: `compressed_${file.name}`,
      });

      const reduction = Math.round((1 - newSize / originalSize) * 100);
      toast.success(
        reduction > 0
          ? `Compressed by ${reduction}% (${formatSize(originalSize)} → ${formatSize(newSize)})`
          : "File is already optimized — no further compression possible"
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to compress PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdf(result.bytes, result.filename);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
  };

  return (
    <ToolPageLayout tool={tool}>
      {!result ? (
        <>
          <FileUpload
            accept=".pdf"
            files={files}
            onFilesSelected={(f) => {
              setFiles(f.slice(0, 1));
              setResult(null);
            }}
            onRemoveFile={handleReset}
          />

          {files.length > 0 && !processing && (
            <div className="mt-6 mx-auto max-w-md space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Compression Level</label>
                  <span className="text-sm font-semibold text-primary">{config.label}</span>
                </div>
                <Slider
                  value={[levelIndex]}
                  onValueChange={(v) => setLevelIndex(v[0])}
                  min={0}
                  max={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Max</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">{config.description}</p>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleCompress} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
                  <Shrink className="h-4 w-4" />
                  Compress PDF
                </Button>
              </div>
            </div>
          )}

          {processing && <ProcessingProgress label="Compressing PDF…" progress={progress} />}
        </>
      ) : (
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <FileDown className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Compression Complete</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">Original</p>
                <p className="text-lg font-bold text-foreground">{formatSize(result.originalSize)}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-muted-foreground">Compressed</p>
                <p className="text-lg font-bold text-primary">{formatSize(result.newSize)}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-primary">
              {Math.round((1 - result.newSize / result.originalSize) * 100)}% smaller
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleDownload} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
              <Download className="h-4 w-4" />
              Download Compressed PDF
            </Button>
            <Button size="lg" variant="outline" onClick={handleReset}>
              Compress Another
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default CompressPdf;
