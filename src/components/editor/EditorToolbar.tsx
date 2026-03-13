import {
  MousePointer2, Type, Highlighter, Pencil, ImageIcon, PenTool,
  Undo2, Redo2, Download, ZoomIn, ZoomOut, Maximize,
  Bold, Italic, Square, Circle, Eraser, Minus, Underline, Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { EditorTool, DrawShape, HighlightStyle } from "@/lib/editor-types";

const tools: { id: EditorTool; icon: typeof Type; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "text", icon: Type, label: "Text" },
  { id: "highlight", icon: Highlighter, label: "Highlight" },
  { id: "draw", icon: Pencil, label: "Draw" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "signature", icon: PenTool, label: "Signature" },
];

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#fde047"];

interface EditorToolbarProps {
  activeTool: EditorTool;
  onSetTool: (t: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoom: (z: number) => void;
  onExport: () => void;
  // text props
  textColor: string;
  onTextColor: (c: string) => void;
  textFontSize: number;
  onTextFontSize: (s: number) => void;
  textBold: boolean;
  onTextBold: (b: boolean) => void;
  textItalic: boolean;
  onTextItalic: (b: boolean) => void;
  // draw props
  drawColor: string;
  onDrawColor: (c: string) => void;
  drawStrokeWidth: number;
  onDrawStrokeWidth: (w: number) => void;
  drawShape: DrawShape;
  onDrawShape: (s: DrawShape) => void;
  // highlight props
  highlightColor: string;
  onHighlightColor: (c: string) => void;
  highlightStyle: HighlightStyle;
  onHighlightStyle: (s: HighlightStyle) => void;
}

const ColorPicker = ({ color, onChange }: { color: string; onChange: (c: string) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="h-6 w-6 rounded border border-border" style={{ backgroundColor: color }} />
    </PopoverTrigger>
    <PopoverContent className="w-auto p-2" align="start">
      <div className="flex gap-1 flex-wrap max-w-[160px]">
        {COLORS.map((c) => (
          <button
            key={c}
            className={cn("h-6 w-6 rounded border", color === c ? "ring-2 ring-primary" : "border-border")}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full h-7 cursor-pointer" />
    </PopoverContent>
  </Popover>
);

export default function EditorToolbar(props: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b bg-card px-2 py-1.5 flex-wrap">
      {/* Tool selector */}
      {tools.map((t) => (
        <Button
          key={t.id}
          variant={props.activeTool === t.id ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 gap-1 text-xs"
          onClick={() => props.onSetTool(t.id)}
          title={t.label}
        >
          <t.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.label}</span>
        </Button>
      ))}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Context-sensitive options */}
      {props.activeTool === "text" && (
        <div className="flex items-center gap-1">
          <ColorPicker color={props.textColor} onChange={props.onTextColor} />
          <select
            value={props.textFontSize}
            onChange={(e) => props.onTextFontSize(Number(e.target.value))}
            className="h-8 rounded border border-input bg-background px-1 text-xs"
          >
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
          <Button variant={props.textBold ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => props.onTextBold(!props.textBold)}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant={props.textItalic ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => props.onTextItalic(!props.textItalic)}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>
      )}

      {props.activeTool === "draw" && (
        <div className="flex items-center gap-1">
          <ColorPicker color={props.drawColor} onChange={props.onDrawColor} />
          <div className="flex items-center gap-1 w-24">
            <Slider value={[props.drawStrokeWidth]} onValueChange={([v]) => props.onDrawStrokeWidth(v)} min={1} max={20} step={1} className="flex-1" />
            <span className="text-xs text-muted-foreground w-6">{props.drawStrokeWidth}</span>
          </div>
          {([["freehand", Pencil], ["rectangle", Square], ["circle", Circle], ["eraser", Eraser]] as [DrawShape, typeof Pencil][]).map(([s, Icon]) => (
            <Button key={s} variant={props.drawShape === s ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => props.onDrawShape(s)}>
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>
      )}

      {props.activeTool === "highlight" && (
        <div className="flex items-center gap-1">
          <ColorPicker color={props.highlightColor} onChange={props.onHighlightColor} />
          {([["highlight", Highlighter], ["underline", Underline], ["strikethrough", Strikethrough]] as [HighlightStyle, typeof Highlighter][]).map(([s, Icon]) => (
            <Button key={s} variant={props.highlightStyle === s ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => props.onHighlightStyle(s)}>
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>
      )}

      {/* Undo / Redo */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={props.onUndo} disabled={!props.canUndo} title="Undo">
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={props.onRedo} disabled={!props.canRedo} title="Redo">
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <div className="flex-1" />

      {/* Zoom */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.onZoom(props.zoom - 0.25)} title="Zoom out">
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(props.zoom * 100)}%</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.onZoom(props.zoom + 0.25)} title="Zoom in">
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.onZoom(1)} title="Fit">
        <Maximize className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button size="sm" className="h-8 gap-1 bg-gradient-hero text-primary-foreground hover:opacity-90" onClick={props.onExport}>
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );
}
