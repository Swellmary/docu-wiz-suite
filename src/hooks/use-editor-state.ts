import { useState, useCallback, useRef } from "react";
import type { Annotation, EditorState, EditorTool, DrawShape, HighlightStyle, EditorPage } from "@/lib/editor-types";

const initialState: EditorState = {
  activeTool: "select",
  annotations: [],
  pages: [],
  currentPage: 0,
  zoom: 1,
  drawColor: "#ef4444",
  drawStrokeWidth: 3,
  drawShape: "freehand",
  textColor: "#000000",
  textFontSize: 16,
  textBold: false,
  textItalic: false,
  highlightColor: "#fde047",
  highlightStyle: "highlight",
};

export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState);
  const undoStack = useRef<Annotation[][]>([]);
  const redoStack = useRef<Annotation[][]>([]);

  const pushUndo = useCallback(() => {
    undoStack.current.push([...state.annotations]);
    redoStack.current = [];
  }, [state.annotations]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev !== undefined) {
      redoStack.current.push([...state.annotations]);
      setState((s) => ({ ...s, annotations: prev }));
    }
  }, [state.annotations]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next !== undefined) {
      undoStack.current.push([...state.annotations]);
      setState((s) => ({ ...s, annotations: next }));
    }
  }, [state.annotations]);

  const addAnnotation = useCallback(
    (ann: Annotation) => {
      pushUndo();
      setState((s) => ({ ...s, annotations: [...s.annotations, ann] }));
    },
    [pushUndo]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      pushUndo();
      setState((s) => ({
        ...s,
        annotations: s.annotations.map((a) =>
          a.id === id ? ({ ...a, ...updates } as Annotation) : a
        ),
      }));
    },
    [pushUndo]
  );

  const removeAnnotation = useCallback(
    (id: string) => {
      pushUndo();
      setState((s) => ({
        ...s,
        annotations: s.annotations.filter((a) => a.id !== id),
      }));
    },
    [pushUndo]
  );

  const setTool = useCallback((tool: EditorTool) => {
    setState((s) => ({ ...s, activeTool: tool }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState((s) => ({ ...s, currentPage: page }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((s) => ({ ...s, zoom: Math.max(0.25, Math.min(3, zoom)) }));
  }, []);

  const setDrawColor = useCallback((c: string) => setState((s) => ({ ...s, drawColor: c })), []);
  const setDrawStrokeWidth = useCallback((w: number) => setState((s) => ({ ...s, drawStrokeWidth: w })), []);
  const setDrawShape = useCallback((shape: DrawShape) => setState((s) => ({ ...s, drawShape: shape })), []);
  const setTextColor = useCallback((c: string) => setState((s) => ({ ...s, textColor: c })), []);
  const setTextFontSize = useCallback((sz: number) => setState((s) => ({ ...s, textFontSize: sz })), []);
  const setTextBold = useCallback((b: boolean) => setState((s) => ({ ...s, textBold: b })), []);
  const setTextItalic = useCallback((b: boolean) => setState((s) => ({ ...s, textItalic: b })), []);
  const setHighlightColor = useCallback((c: string) => setState((s) => ({ ...s, highlightColor: c })), []);
  const setHighlightStyle = useCallback((st: HighlightStyle) => setState((s) => ({ ...s, highlightStyle: st })), []);

  const initPages = useCallback((count: number) => {
    const pages: EditorPage[] = Array.from({ length: count }, (_, i) => ({
      id: `page-${i}`,
      sourcePageIndex: i,
      rotation: 0,
      deleted: false,
    }));
    setState((s) => ({ ...s, pages, currentPage: 0 }));
  }, []);

  const reorderPages = useCallback((newPages: EditorPage[]) => {
    setState((s) => ({ ...s, pages: newPages }));
  }, []);

  const deletePage = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) => (p.id === id ? { ...p, deleted: true } : p)),
    }));
  }, []);

  const duplicatePage = useCallback((id: string) => {
    setState((s) => {
      const idx = s.pages.findIndex((p) => p.id === id);
      if (idx === -1) return s;
      const original = s.pages[idx];
      const newId = `page-${original.sourcePageIndex}-dup-${Date.now()}`;
      const dup: EditorPage = { 
        ...original, 
        id: newId
      };
      
      // Duplicate annotations for this page
      const pageAnns = s.annotations.filter(a => (a as any).pageId === id);
      const duplicatedAnns = pageAnns.map(a => ({
        ...a,
        id: `${a.id}-dup-${Date.now()}`,
        pageId: newId
      } as Annotation));

      const newPages = [...s.pages];
      newPages.splice(idx + 1, 0, dup);
      return { 
        ...s, 
        pages: newPages,
        annotations: [...s.annotations, ...duplicatedAnns]
      };
    });
  }, []);

  return {
    state,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setTool,
    setCurrentPage,
    setZoom,
    setDrawColor,
    setDrawStrokeWidth,
    setDrawShape,
    setTextColor,
    setTextFontSize,
    setTextBold,
    setTextItalic,
    setHighlightColor,
    setHighlightStyle,
    initPages,
    reorderPages,
    deletePage,
    duplicatePage,
  };
}
