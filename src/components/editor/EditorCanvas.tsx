import { useRef, useState, useEffect, useCallback, type MouseEvent } from "react";
import { X, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Annotation,
  TextAnnotation,
  HighlightAnnotation,
  DrawAnnotation,
  ImageAnnotation,
  SignatureAnnotation,
  EditorTool,
  DrawShape,
  Position,
  HighlightStyle,
} from "@/lib/editor-types";

interface EditorCanvasProps {
  pageDataUrl: string | null;
  pageWidth: number;
  pageHeight: number;
  zoom: number;
  activeTool: EditorTool;
  annotations: Annotation[];
  currentPageId: string;
  // tool settings
  textColor: string;
  textFontSize: number;
  textBold: boolean;
  textItalic: boolean;
  drawColor: string;
  drawStrokeWidth: number;
  drawShape: DrawShape;
  highlightColor: string;
  highlightStyle: HighlightStyle;
  // callbacks
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onRemoveAnnotation: (id: string) => void;
  onImageUpload: () => void;
  onSignature: () => void;
}

let idCounter = 0;
const nextId = () => `ann-${++idCounter}-${Date.now()}`;

export default function EditorCanvas({
  pageDataUrl,
  pageWidth,
  pageHeight,
  zoom,
  activeTool,
  annotations,
  currentPageId,
  textColor,
  textFontSize,
  textBold,
  textItalic,
  drawColor,
  drawStrokeWidth,
  drawShape,
  highlightColor,
  highlightStyle,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  onImageUpload,
  onSignature,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<DrawAnnotation | null>(null);
  const [highlightStart, setHighlightStart] = useState<Position | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const pageAnns = annotations.filter((a) => a.pageId === currentPageId);
  const w = pageWidth * zoom;
  const h = pageHeight * zoom;

  const getRelPos = useCallback(
    (e: MouseEvent): Position => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
    },
    [zoom]
  );

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    // Don't create new annotations when clicking on existing text being edited
    if (editingTextId) return;
    const pos = getRelPos(e);

    if (activeTool === "text") {
      const id = nextId();
      const ann: TextAnnotation = {
        type: "text",
        id,
        pageId: currentPageId,
        position: pos,
        text: "",
        fontSize: textFontSize,
        fontWeight: textBold ? "bold" : "normal",
        fontStyle: textItalic ? "italic" : "normal",
        color: textColor,
      };
      onAddAnnotation(ann);
      // Use timeout so the element renders before we set editing
      setTimeout(() => {
        setEditingTextId(id);
        setSelectedId(id);
      }, 0);
      return;
    }

    if (activeTool === "draw") {
      setDrawing(true);
      if (drawShape === "freehand" || drawShape === "eraser") {
        setCurrentDraw({
          type: "draw",
          id: nextId(),
          pageId: currentPageId,
          points: [pos],
          color: drawShape === "eraser" ? "#ffffff" : drawColor,
          strokeWidth: drawShape === "eraser" ? drawStrokeWidth * 3 : drawStrokeWidth,
          shape: drawShape,
        });
      } else {
        setCurrentDraw({
          type: "draw",
          id: nextId(),
          pageId: currentPageId,
          points: [],
          color: drawColor,
          strokeWidth: drawStrokeWidth,
          shape: drawShape,
          startPos: pos,
          endPos: pos,
        });
      }
      return;
    }

    if (activeTool === "highlight") {
      setHighlightStart(pos);
      return;
    }

    if (activeTool === "image") {
      onImageUpload();
      return;
    }

    if (activeTool === "signature") {
      onSignature();
      return;
    }

    // select tool - deselect
    setSelectedId(null);
    setEditingTextId(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const pos = getRelPos(e);

    if (dragging) {
      const ann = annotations.find((a) => a.id === dragging.id);
      if (ann) {
        onUpdateAnnotation(dragging.id, {
          position: { x: pos.x - dragging.offsetX, y: pos.y - dragging.offsetY },
        } as Partial<Annotation>);
      }
      return;
    }

    if (resizing) {
      const ann = annotations.find((a) => a.id === resizing.id) as ImageAnnotation | SignatureAnnotation | HighlightAnnotation | undefined;
      if (ann && "size" in ann) {
        const newW = Math.max(20, pos.x - ann.position.x);
        const newH = Math.max(20, pos.y - ann.position.y);
        onUpdateAnnotation(resizing.id, { size: { width: newW, height: newH } } as Partial<Annotation>);
      }
      return;
    }

    if (drawing && currentDraw) {
      if (currentDraw.shape === "freehand" || currentDraw.shape === "eraser") {
        setCurrentDraw({ ...currentDraw, points: [...currentDraw.points, pos] });
      } else {
        setCurrentDraw({ ...currentDraw, endPos: pos });
      }
      return;
    }

    if (highlightStart) {
      // preview handled via CSS
      return;
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    const pos = getRelPos(e);

    if (dragging) {
      setDragging(null);
      return;
    }
    if (resizing) {
      setResizing(null);
      return;
    }

    if (drawing && currentDraw) {
      setDrawing(false);
      onAddAnnotation(currentDraw);
      setCurrentDraw(null);
      return;
    }

    if (highlightStart) {
      const x = Math.min(highlightStart.x, pos.x);
      const y = Math.min(highlightStart.y, pos.y);
      const w = Math.abs(pos.x - highlightStart.x);
      const h = Math.abs(pos.y - highlightStart.y);
      if (w > 5 && h > 5) {
        const ann: HighlightAnnotation = {
          type: "highlight",
          id: nextId(),
          pageId: currentPageId,
          position: { x, y },
          size: { width: w, height: h },
          color: highlightColor,
          style: highlightStyle,
        };
        onAddAnnotation(ann);
      }
      setHighlightStart(null);
    }
  };

  const startDrag = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeTool !== "select") return;
    const pos = getRelPos(e);
    const ann = annotations.find((a) => a.id === id);
    if (!ann || !("position" in ann)) return;
    setSelectedId(id);
    setDragging({ id, offsetX: pos.x - ann.position.x, offsetY: pos.y - ann.position.y });
  };

  const startResize = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setResizing({ id, corner: "br" });
  };

  const renderDrawing = (draw: DrawAnnotation, isLive = false) => {
    if (draw.shape === "freehand" || draw.shape === "eraser") {
      if (draw.points.length < 2) return null;
      const d = draw.points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
      return (
        <path
          key={isLive ? "live" : draw.id}
          d={d}
          stroke={draw.color}
          strokeWidth={draw.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if ((draw.shape === "rectangle" || draw.shape === "circle") && draw.startPos && draw.endPos) {
      const x = Math.min(draw.startPos.x, draw.endPos.x);
      const y = Math.min(draw.startPos.y, draw.endPos.y);
      const w = Math.abs(draw.endPos.x - draw.startPos.x);
      const h = Math.abs(draw.endPos.y - draw.startPos.y);
      if (draw.shape === "rectangle") {
        return <rect key={isLive ? "live" : draw.id} x={x} y={y} width={w} height={h} stroke={draw.color} strokeWidth={draw.strokeWidth} fill="none" />;
      }
      return <ellipse key={isLive ? "live" : draw.id} cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={draw.color} strokeWidth={draw.strokeWidth} fill="none" />;
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-4">
      <div
        ref={canvasRef}
        className="relative bg-card shadow-lg"
        style={{ width: w, height: h, cursor: activeTool === "select" ? "default" : "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* PDF page image */}
        {pageDataUrl && (
          <img src={pageDataUrl} alt="PDF page" className="absolute inset-0 w-full h-full pointer-events-none" draggable={false} />
        )}

        {/* SVG layer for drawings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${pageWidth} ${pageHeight}`}>
          {pageAnns.filter((a) => a.type === "draw").map((a) => renderDrawing(a as DrawAnnotation))}
          {currentDraw && renderDrawing(currentDraw, true)}
        </svg>

        {/* Highlight annotations */}
        {pageAnns
          .filter((a) => a.type === "highlight")
          .map((a) => {
            const h = a as HighlightAnnotation;
            let style: React.CSSProperties = {
              left: h.position.x * zoom,
              top: h.position.y * zoom,
              width: h.size.width * zoom,
              height: h.size.height * zoom,
            };
            if (h.style === "highlight") {
              style.backgroundColor = h.color;
              style.opacity = 0.3;
            } else if (h.style === "underline") {
              style.borderBottom = `3px solid ${h.color}`;
              style.backgroundColor = "transparent";
            } else {
              style.background = `linear-gradient(transparent 45%, ${h.color} 45%, ${h.color} 55%, transparent 55%)`;
            }
            return (
              <div
                key={h.id}
                className={cn("absolute", selectedId === h.id && "ring-2 ring-primary")}
                style={style}
                onMouseDown={(e) => startDrag(e, h.id)}
              >
                {selectedId === h.id && (
                  <>
                    <button className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-destructive text-primary-foreground flex items-center justify-center" onClick={() => onRemoveAnnotation(h.id)}>
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-primary cursor-se-resize" onMouseDown={(e) => startResize(e, h.id)} />
                  </>
                )}
              </div>
            );
          })}

        {/* Text annotations */}
        {pageAnns
          .filter((a) => a.type === "text")
          .map((a) => {
            const t = a as TextAnnotation;
            return (
              <div
                key={t.id}
                className={cn(
                  "absolute group",
                  selectedId === t.id && "ring-2 ring-primary rounded"
                )}
                style={{
                  left: t.position.x * zoom,
                  top: t.position.y * zoom,
                  fontSize: t.fontSize * zoom,
                  fontWeight: t.fontWeight,
                  fontStyle: t.fontStyle,
                  color: t.color,
                  minWidth: 40 * zoom,
                  cursor: activeTool === "select" ? "move" : "default",
                }}
                onMouseDown={(e) => {
                  if (activeTool === "select") {
                    startDrag(e, t.id);
                    setSelectedId(t.id);
                  }
                }}
                onDoubleClick={() => setEditingTextId(t.id)}
              >
                {editingTextId === t.id ? (
                  <input
                    autoFocus
                    className="bg-transparent border-b border-primary outline-none min-w-[60px]"
                    style={{ fontSize: "inherit", fontWeight: "inherit", fontStyle: "inherit", color: "inherit" }}
                    value={t.text}
                    onChange={(e) => onUpdateAnnotation(t.id, { text: e.target.value } as Partial<TextAnnotation>)}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingTextId(null)}
                  />
                ) : (
                  <span className="whitespace-pre select-none">{t.text}</span>
                )}
                {selectedId === t.id && (
                  <button className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-destructive text-primary-foreground flex items-center justify-center" onClick={() => onRemoveAnnotation(t.id)}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

        {/* Image / Signature annotations */}
        {pageAnns
          .filter((a) => a.type === "image" || a.type === "signature")
          .map((a) => {
            const img = a as ImageAnnotation | SignatureAnnotation;
            return (
              <div
                key={img.id}
                className={cn("absolute", selectedId === img.id && "ring-2 ring-primary")}
                style={{
                  left: img.position.x * zoom,
                  top: img.position.y * zoom,
                  width: img.size.width * zoom,
                  height: img.size.height * zoom,
                  cursor: activeTool === "select" ? "move" : "default",
                }}
                onMouseDown={(e) => startDrag(e, img.id)}
                onClick={() => setSelectedId(img.id)}
              >
                <img src={img.dataUrl} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                {selectedId === img.id && (
                  <>
                    <button className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-destructive text-primary-foreground flex items-center justify-center" onClick={() => onRemoveAnnotation(img.id)}>
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-primary cursor-se-resize" onMouseDown={(e) => startResize(e, img.id)} />
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
