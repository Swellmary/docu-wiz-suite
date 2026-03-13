import { Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageThumbnail } from "@/lib/pdf-preview";
import type { EditorPage } from "@/lib/editor-types";
import { useState } from "react";

interface PagePanelProps {
  thumbnails: PageThumbnail[];
  pages: EditorPage[];
  currentPage: number;
  onSelectPage: (idx: number) => void;
  onReorder: (pages: EditorPage[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function PagePanel({
  thumbnails,
  pages,
  currentPage,
  onSelectPage,
  onReorder,
  onDelete,
  onDuplicate,
}: PagePanelProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const visiblePages = pages.filter((p) => !p.deleted);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...pages];
    const visibleIndices = pages.reduce<number[]>((acc, p, i) => {
      if (!p.deleted) acc.push(i);
      return acc;
    }, []);
    const fromActual = visibleIndices[dragIdx];
    const toActual = visibleIndices[targetIdx];
    const [moved] = reordered.splice(fromActual, 1);
    reordered.splice(toActual, 0, moved);
    onReorder(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="w-36 border-r bg-card overflow-y-auto flex-shrink-0">
      <div className="p-2 text-xs font-semibold text-muted-foreground border-b">Pages</div>
      <div className="p-1.5 space-y-1.5">
        {visiblePages.map((page, vIdx) => {
          const thumb = thumbnails.find((t) => t.pageNumber === page.sourcePageIndex + 1);
          return (
            <div
              key={page.id}
              className={cn(
                "group relative rounded-md border cursor-pointer overflow-hidden transition-all",
                currentPage === vIdx
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40",
                dragOverIdx === vIdx && "border-primary/60 bg-primary/5"
              )}
              draggable
              onDragStart={() => setDragIdx(vIdx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(vIdx); }}
              onDrop={() => handleDrop(vIdx)}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              onClick={() => onSelectPage(vIdx)}
            >
              <div className="aspect-[3/4] bg-muted">
                {thumb && (
                  <img
                    src={thumb.dataUrl}
                    alt={`Page ${vIdx + 1}`}
                    className="h-full w-full object-contain"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="text-[10px] text-muted-foreground">{vIdx + 1}</span>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-0.5 rounded hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
                    title="Duplicate"
                  >
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-0.5 rounded hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                    title="Delete"
                  >
                    <Trash2 className="h-2.5 w-2.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
