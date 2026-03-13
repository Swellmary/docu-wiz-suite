import { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { toast } from "sonner";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [pageImages, setPageImages] = useState<Map<number, { url: string; w: number; h: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditorState();
  const { state } = editor;

  const visiblePages = state.pages.filter((p) => !p.deleted);
  const currentVisible = visiblePages[state.currentPage];

  const loadPdf = useCallback(async (f: File) => {
    setLoading(true);
    try {
      const buf = await f.arrayBuffer();
      setPdfBytes(buf);
      setFile(f);

      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      editor.initPages(total);

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
      toast.success(`Loaded ${total} pages`);
    } catch {
      toast.error("Failed to load PDF");
    } finally {
      setLoading(false);
    }
  }, [editor]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type === "application/pdf") loadPdf(f);
    },
    [loadPdf]
  );

  const handleImageUpload = () => imgInputRef.current?.click();

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ann: ImageAnnotation = {
        type: "image",
        id: `img-${Date.now()}`,
        pageIndex: currentVisible?.pageIndex ?? 0,
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
    const ann: SignatureAnnotation = {
      type: "signature",
      id: `sig-${Date.now()}`,
      pageIndex: currentVisible?.pageIndex ?? 0,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 60 },
      dataUrl,
    };
    editor.addAnnotation(ann);
    editor.setTool("select");
  };

  const handleExport = async (options: ExportOptions) => {
    if (!pdfBytes) return;
    setExporting(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const pdfPages = doc.getPages();

      // Remove deleted pages (in reverse to keep indices)
      const deletedIndices = state.pages
        .filter((p) => p.deleted)
        .map((p) => p.pageIndex)
        .sort((a, b) => b - a);
      for (const idx of deletedIndices) {
        if (idx < pdfPages.length) doc.removePage(idx);
      }

      // Apply annotations to pages
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const remainingPages = doc.getPages();

      for (const ann of state.annotations) {
        if (ann.type === "text") {
          const pageIdx = visiblePages.findIndex((p) => p.pageIndex === ann.pageIndex);
          if (pageIdx < 0 || pageIdx >= remainingPages.length) continue;
          const page = remainingPages[pageIdx];
          const { height } = page.getSize();
          const scale = page.getSize().width / (pageImages.get(ann.pageIndex + 1)?.w ?? page.getSize().width) * RENDER_SCALE;
          page.drawText(ann.text, {
            x: ann.position.x * scale,
            y: height - ann.position.y * scale - ann.fontSize * scale,
            size: ann.fontSize * scale,
            font,
            color: hexToRgb(ann.color),
          });
        }
        if (ann.type === "image" || ann.type === "signature") {
          const pageIdx = visiblePages.findIndex((p) => p.pageIndex === ann.pageIndex);
          if (pageIdx < 0 || pageIdx >= remainingPages.length) continue;
          const page = remainingPages[pageIdx];
          const { height, width: pw } = page.getSize();
          const scale = pw / (pageImages.get(ann.pageIndex + 1)?.w ?? pw) * RENDER_SCALE;
          try {
            const imgData = ann.dataUrl;
            let img;
            if (imgData.includes("image/png")) {
              img = await doc.embedPng(imgData);
            } else {
              img = await doc.embedJpg(imgData);
            }
            page.drawImage(img, {
              x: ann.position.x * scale,
              y: height - ann.position.y * scale - ann.size.height * scale,
              width: ann.size.width * scale,
              height: ann.size.height * scale,
            });
          } catch {
            // skip if embedding fails
          }
        }
      }

      // Watermark
      if (options.addWatermark && options.watermarkText.trim()) {
        const wFont = await doc.embedFont(StandardFonts.HelveticaBold);
        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          const fontSize = Math.min(width, height) * 0.08;
          const tw = wFont.widthOfTextAtSize(options.watermarkText, fontSize);
          page.drawText(options.watermarkText, {
            x: (width - tw) / 2,
            y: height / 2,
            size: fontSize,
            font: wFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: options.watermarkOpacity / 100,
            rotate: degrees(-45),
          });
        }
      }

      const output = await doc.save();
      downloadPdf(output, `edited_${file?.name ?? "document.pdf"}`);
      toast.success("PDF exported successfully!");
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const currentImg = currentVisible ? pageImages.get(currentVisible.pageIndex + 1) : null;

  // Upload screen
  if (!file) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all hover:border-primary/40 hover:bg-accent/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadPdf(e.target.files[0])}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Upload className="h-6 w-6 text-primary" />
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
            currentPageIndex={currentVisible?.pageIndex ?? 0}
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
