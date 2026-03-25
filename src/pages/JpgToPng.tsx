import { useState } from "react";
import { toast } from "sonner";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "jpg-to-png")!;

const JpgToPng = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    setResults([]);
    try {
      const out: { name: string; url: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const img = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        const url = URL.createObjectURL(blob);
        out.push({ name: file.name.replace(/\.jpe?g$/i, ".png"), url });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setResults(out);
      toast.success(`Converted ${out.length} image(s) to PNG!`);
    } catch {
      toast.error("Failed to convert images.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".jpg,.jpeg" multiple files={files} onFilesSelected={(f) => setFiles((p) => [...p, ...f])} onRemoveFile={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))} />
      {processing && <ProcessingProgress label="Converting…" progress={progress} />}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
              <span className="text-sm font-medium truncate">{r.name}</span>
              <a href={r.url} download={r.name}><Button size="sm" variant="outline" className="gap-1"><Download className="h-3 w-3" />Download</Button></a>
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <ImageIcon className="h-4 w-4" /> Convert to PNG
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default JpgToPng;
