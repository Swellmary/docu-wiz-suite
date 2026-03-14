import { useState, useCallback, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { toast } from "sonner";
import { Upload, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import PagePanel from "@/components/editor/PagePanel";
import SignatureDialog from "@/components/editor/SignatureDialog";
import ExportDialog, { type ExportOptions } from "@/components/editor/ExportDialog";
import { useEditorState } from "@/hooks/use-editor-state";
import { downloadPdf } from "@/lib/pdf-utils";
import type { PageThumbnail } from "@/lib/pdf-preview";
import type { ImageAnnotation, SignatureAnnotation } from "@/lib/editor-types";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const RENDER_SCALE = 2;

const PdfEditor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [pageImages, setPageImages] = useState<Map<number, { url: string; w: number; h: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditorState();
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const { state } = editor;

  const visiblePages = state.pages.filter((p) => !p.deleted);
  const currentVisible = visiblePages[state.currentPage];

  const loadPdf = useCallback(async (f: File) => {
    setLoading(true);
    try {
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf);
      setPdfBytes(bytes);
      setFile(f);

      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      const total = pdf.numPages;
      editorRef.current.initPages(total);

      const thumbs: PageThumbnail[] = [];
      const imgs = new Map<number, { url: string; w: number; h: number }>();

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        // thumbnail
        const tvp = page.getViewport({ scale: 0.3 });
        const tc = document.createElement("canvas");
        tc.width = tvp.width;
        tc.height = tvp.height;
        await page.render({ canvasContext: tc.getContext("2d")!, viewport: tvp }).promise;
        thumbs.push({ pageNumber: i, dataUrl: tc.toDataURL("image/jpeg", 0.6), width: tvp.width, height: tvp.height });

        // full render
        const vp = page.getViewport({ scale: RENDER_SCALE });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        imgs.set(i, { url: c.toDataURL("image/png"), w: vp.width, h: vp.height });
      }

      setThumbnails(thumbs);
      setPageImages(imgs);
      toast.success(`Loaded ${total} page${total > 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f?.type === "application/pdf") loadPdf(f);
      else toast.error("Please drop a PDF file");
    },
    [loadPdf]
  );

  const handleImageUpload = () => imgInputRef.current?.click();

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !currentVisible) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ann: ImageAnnotation = {
        type: "image",
        id: `img-${Date.now()}`,
        pageId: currentVisible.id,
        position: { x: 50, y: 50 },
        size: { width: 150, height: 150 },
        dataUrl: reader.result as string,
      };
      editor.addAnnotation(ann);
      editor.setTool("select");
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const onSignature = (dataUrl: string) => {
    if (!currentVisible) return;
    const ann: SignatureAnnotation = {
      type: "signature",
      id: `sig-${Date.now()}`,
      pageId: currentVisible.id,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 60 },
      dataUrl,
    };
    editor.addAnnotation(ann);
    editor.setTool("select");
  };

  const handleExport = async (options: ExportOptions) => {
    if (!pdfBytes || !file) return;
    setExporting(true);
    try {
      const sourceDoc = await PDFDocument.load(pdfBytes);
      const outDoc = await PDFDocument.create();

      const font = await outDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

      for (const pageInfo of visiblePages) {
        const [copiedPage] = await outDoc.copyPages(sourceDoc, [pageInfo.sourcePageIndex]);
        const page = outDoc.addPage(copiedPage);
        const { width: pw, height: ph } = page.getSize();

        if (pageInfo.rotation !== 0) {
          page.setRotation(degrees(pageInfo.rotation));
        }

        const uiDim = pageImages.get(pageInfo.sourcePageIndex + 1);
        const scale = uiDim ? pw / (uiDim.w / RENDER_SCALE) : 1;

        const pageAnns = state.annotations.filter((a) => a.pageId === pageInfo.id);

        for (const ann of pageAnns) {
          if (ann.type === "text") {
            page.drawText(ann.text, {
              x: ann.position.x * scale,
              y: ph - ann.position.y * scale - ann.fontSize * scale,
              size: ann.fontSize * scale,
              font: ann.fontWeight === "bold" ? fontBold : font,
              color: hexToRgb(ann.color),
            });
          } else if (ann.type === "image" || ann.type === "signature") {
            try {
              const imgData = ann.dataUrl;
              const img = imgData.includes("image/png")
                ? await outDoc.embedPng(imgData)
                : await outDoc.embedJpg(imgData);

              page.drawImage(img, {
                x: ann.position.x * scale,
                y: ph - ann.position.y * scale - ann.size.height * scale,
                width: ann.size.width * scale,
                height: ann.size.height * scale,
              });
            } catch (imgErr) {
              console.warn("Failed to embed image/signature:", imgErr);
            }
          } else if (ann.type === "draw") {
            if (ann.shape === "freehand" || ann.shape === "eraser") {
              if (ann.points.length > 1) {
                for (let i = 0; i < ann.points.length - 1; i++) {
                  const start = ann.points[i];
                  const end = ann.points[i + 1];
                  page.drawLine({
                    start: { x: start.x * scale, y: ph - start.y * scale },
                    end: { x: end.x * scale, y: ph - end.y * scale },
                    thickness: ann.strokeWidth * scale,
                    color: hexToRgb(ann.color),
                    opacity: ann.shape === "eraser" ? 0 : 1,
                  });
                }
              }
            } else if (ann.startPos && ann.endPos) {
              const x = Math.min(ann.startPos.x, ann.endPos.x) * scale;
              const y = ph - Math.max(ann.startPos.y, ann.endPos.y) * scale;
              const w = Math.abs(ann.endPos.x - ann.startPos.x) * scale;
              const h = Math.abs(ann.endPos.y - ann.startPos.y) * scale;

              if (ann.shape === "rectangle") {
                page.drawRectangle({
                  x, y, width: w, height: h,
                  borderColor: hexToRgb(ann.color),
                  borderWidth: ann.strokeWidth * scale,
                });
              } else if (ann.shape === "circle") {
                page.drawEllipse({
                  x: x + w / 2,
                  y: y + h / 2,
                  xScale: w / 2,
                  yScale: h / 2,
                  borderColor: hexToRgb(ann.color),
                  borderWidth: ann.strokeWidth * scale,
                });
              }
            }
          } else if (ann.type === "highlight") {
            if (ann.style === "highlight") {
              page.drawRectangle({
                x: ann.position.x * scale,
                y: ph - ann.position.y * scale - ann.size.height * scale,
                width: ann.size.width * scale,
                height: ann.size.height * scale,
                color: hexToRgb(ann.color),
                opacity: 0.3,
              });
            } else if (ann.style === "underline") {
              page.drawLine({
                start: { x: ann.position.x * scale, y: ph - (ann.position.y + ann.size.height) * scale },
                end: { x: (ann.position.x + ann.size.width) * scale, y: ph - (ann.position.y + ann.size.height) * scale },
                thickness: 2 * scale,
                color: hexToRgb(ann.color),
              });
            } else if (ann.style === "strikethrough") {
              page.drawLine({
                start: { x: ann.position.x * scale, y: ph - (ann.position.y + ann.size.height / 2) * scale },
                end: { x: (ann.position.x + ann.size.width) * scale, y: ph - (ann.position.y + ann.size.height / 2) * scale },
                thickness: 2 * scale,
                color: hexToRgb(ann.color),
              });
            }
          }
        }

        // Watermark
        if (options.addWatermark && options.watermarkText.trim()) {
          const wFont = await outDoc.embedFont(StandardFonts.HelveticaBold);
          const fontSize = Math.min(pw, ph) * 0.08;
          const tw = wFont.widthOfTextAtSize(options.watermarkText, fontSize);
          page.drawText(options.watermarkText, {
            x: (pw - tw) / 2,
            y: ph / 2,
            size: fontSize,
            font: wFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: options.watermarkOpacity / 100,
            rotate: degrees(-45),
          });
        }
      }

      const output = await outDoc.save();
      downloadPdf(output, `edited_${file.name}`);
      toast.success("PDF exported successfully!");
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Check console for details.");
    } finally {
      setExporting(false);
    }
  };

  const currentImg = currentVisible ? pageImages.get(currentVisible.sourcePageIndex + 1) : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor]);

  // Upload screen
  if (!file) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-lg rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
            isDragOver ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-accent/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadPdf(e.target.files[0])}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            {loading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Upload className="h-6 w-6 text-primary" />}
          </div>
          <p className="text-lg font-semibold">{loading ? "Loading PDF…" : "Drop a PDF here or click to upload"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Open a PDF to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <EditorToolbar
        activeTool={state.activeTool}
        onSetTool={editor.setTool}
        onUndo={editor.undo}
        onRedo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        zoom={state.zoom}
        onZoom={editor.setZoom}
        onExport={() => setExportOpen(true)}
        textColor={state.textColor}
        onTextColor={editor.setTextColor}
        textFontSize={state.textFontSize}
        onTextFontSize={editor.setTextFontSize}
        textBold={state.textBold}
        onTextBold={editor.setTextBold}
        textItalic={state.textItalic}
        onTextItalic={editor.setTextItalic}
        drawColor={state.drawColor}
        onDrawColor={editor.setDrawColor}
        drawStrokeWidth={state.drawStrokeWidth}
        onDrawStrokeWidth={editor.setDrawStrokeWidth}
        drawShape={state.drawShape}
        onDrawShape={editor.setDrawShape}
        highlightColor={state.highlightColor}
        onHighlightColor={editor.setHighlightColor}
        highlightStyle={state.highlightStyle}
        onHighlightStyle={editor.setHighlightStyle}
      />

      <div className="flex flex-1 overflow-hidden">
        <PagePanel
          thumbnails={thumbnails}
          pages={state.pages}
          currentPage={state.currentPage}
          onSelectPage={editor.setCurrentPage}
          onReorder={editor.reorderPages}
          onDelete={editor.deletePage}
          onDuplicate={editor.duplicatePage}
        />

        <div className="flex flex-col flex-1">
          <EditorCanvas
            pageDataUrl={currentImg?.url ?? null}
            pageWidth={currentImg?.w ?? 600}
            pageHeight={currentImg?.h ?? 800}
            zoom={state.zoom}
            activeTool={state.activeTool}
            annotations={state.annotations}
            currentPageId={currentVisible?.id ?? ""}
            textColor={state.textColor}
            textFontSize={state.textFontSize}
            textBold={state.textBold}
            textItalic={state.textItalic}
            drawColor={state.drawColor}
            drawStrokeWidth={state.drawStrokeWidth}
            drawShape={state.drawShape}
            highlightColor={state.highlightColor}
            highlightStyle={state.highlightStyle}
            onAddAnnotation={editor.addAnnotation}
            onUpdateAnnotation={editor.updateAnnotation}
            onRemoveAnnotation={editor.removeAnnotation}
            onImageUpload={handleImageUpload}
            onSignature={() => setSigOpen(true)}
          />

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-2 border-t bg-card py-1.5 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={state.currentPage <= 0}
              onClick={() => editor.setCurrentPage(state.currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <Input
                type="number"
                min={1}
                max={visiblePages.length}
                value={state.currentPage + 1}
                onChange={(e) => {
                  const v = parseInt(e.target.value) - 1;
                  if (v >= 0 && v < visiblePages.length) editor.setCurrentPage(v);
                }}
                className="h-7 w-14 text-center text-xs"
              />
              <span className="text-muted-foreground">/ {visiblePages.length}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={state.currentPage >= visiblePages.length - 1}
              onClick={() => editor.setCurrentPage(state.currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={onImageFile} />
      <SignatureDialog open={sigOpen} onClose={() => setSigOpen(false)} onConfirm={onSignature} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} exporting={exporting} />
    </div>
  );
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export default PdfEditor;
