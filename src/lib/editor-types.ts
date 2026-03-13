export type EditorTool = "select" | "text" | "highlight" | "draw" | "image" | "signature";
export type DrawShape = "freehand" | "rectangle" | "circle" | "eraser";
export type HighlightStyle = "highlight" | "underline" | "strikethrough";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextAnnotation {
  type: "text";
  id: string;
  pageId: string;
  position: Position;
  text: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
}

export interface HighlightAnnotation {
  type: "highlight";
  id: string;
  pageId: string;
  position: Position;
  size: Size;
  color: string;
  style: HighlightStyle;
}

export interface DrawAnnotation {
  type: "draw";
  id: string;
  pageId: string;
  points: Position[];
  color: string;
  strokeWidth: number;
  shape: DrawShape;
  startPos?: Position;
  endPos?: Position;
}

export interface ImageAnnotation {
  type: "image";
  id: string;
  pageId: string;
  position: Position;
  size: Size;
  dataUrl: string;
}

export interface SignatureAnnotation {
  type: "signature";
  id: string;
  pageId: string;
  position: Position;
  size: Size;
  dataUrl: string;
}

export type Annotation =
  | TextAnnotation
  | HighlightAnnotation
  | DrawAnnotation
  | ImageAnnotation
  | SignatureAnnotation;

export interface EditorPage {
  id: string;
  sourcePageIndex: number;
  rotation: number;
  deleted: boolean;
}

export interface EditorState {
  activeTool: EditorTool;
  annotations: Annotation[];
  pages: EditorPage[];
  currentPage: number;
  zoom: number;
  drawColor: string;
  drawStrokeWidth: number;
  drawShape: DrawShape;
  textColor: string;
  textFontSize: number;
  textBold: boolean;
  textItalic: boolean;
  highlightColor: string;
  highlightStyle: HighlightStyle;
}
