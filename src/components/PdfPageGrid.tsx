import { useState } from "react";
import { Check, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageThumbnail } from "@/lib/pdf-preview";

interface PdfPageGridProps {
  pages: PageThumbnail[];
  selectable?: boolean;
  selectedPages?: Set<number>;
  onTogglePage?: (pageNumber: number) => void;
  draggable?: boolean;
  onReorder?: (pages: PageThumbnail[]) => void;
  rotations?: Map<number, number>;
  onRotate?: (pageNumber: number) => void;
  showRotate?: boolean;
}

const PdfPageGrid = ({
  pages,
  selectable = false,
  selectedPages,
  onTogglePage,
  draggable = false,
  onReorder,
  rotations,
  onRotate,
  showRotate = false,
}: PdfPageGridProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    if (!draggable) return;
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (!draggable) return;
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (!draggable || dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...pages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onReorder?.(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {pages.map((page, idx) => {
        const isSelected = selectedPages?.has(page.pageNumber);
        const rotation = rotations?.get(page.pageNumber) ?? 0;
        return (
          <div
            key={`${page.pageNumber}-${idx}`}
            className={cn(
              "group relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-md",
              isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
              dragOverIndex === idx && "border-primary/60 bg-primary/5",
              draggable && "cursor-grab active:cursor-grabbing"
            )}
            draggable={draggable}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            onClick={() => selectable && onTogglePage?.(page.pageNumber)}
          >
            <div className="relative aspect-[3/4] bg-muted">
              <img
                src={page.dataUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              {selectable && isSelected && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-card">
              <span className="text-xs font-medium text-muted-foreground">
                {page.pageNumber}
              </span>
              {showRotate && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRotate?.(page.pageNumber);
                  }}
                >
                  <RotateCw className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PdfPageGrid;
