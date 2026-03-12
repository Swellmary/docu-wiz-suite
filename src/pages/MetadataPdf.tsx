import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "metadata")!;

interface Metadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  pages: number;
  creationDate?: string;
  modificationDate?: string;
}

const MetadataPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const handleExtract = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setMetadata({
        title: doc.getTitle() || "N/A",
        author: doc.getAuthor() || "N/A",
        subject: doc.getSubject() || "N/A",
        creator: doc.getCreator() || "N/A",
        producer: doc.getProducer() || "N/A",
        pages: doc.getPageCount(),
        creationDate: doc.getCreationDate()?.toISOString() || "N/A",
        modificationDate: doc.getModificationDate()?.toISOString() || "N/A",
      });
      toast.success("Metadata extracted!");
    } catch {
      toast.error("Failed to read PDF metadata.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => { setFiles(f.slice(0, 1)); setMetadata(null); }} onRemoveFile={() => { setFiles([]); setMetadata(null); }} />
      {files.length > 0 && !metadata && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={processing} onClick={handleExtract} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {processing ? "Reading…" : "View Metadata"}
          </Button>
        </div>
      )}
      {metadata && (
        <div className="mt-6 rounded-xl border bg-card p-6 space-y-3">
          {Object.entries(metadata).map(([key, val]) => (
            <div key={key} className="flex justify-between border-b pb-2 last:border-0">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-sm text-muted-foreground">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </ToolPageLayout>
  );
};

export default MetadataPdf;
