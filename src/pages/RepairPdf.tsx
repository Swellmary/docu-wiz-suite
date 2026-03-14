import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Wrench } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "repair")!;

const RepairPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ pages: number; size: number } | null>(null);

  const handleRepair = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(10);
    setResult(null);
    try {
      const buffer = await files[0].arrayBuffer();
      setProgress(30);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setProgress(60);

      // Re-save strips unused objects and fixes cross-references
      const pdfBytes = await doc.save();
      setProgress(90);

      const info = { pages: doc.getPageCount(), size: pdfBytes.length };
      setResult(info);

      downloadPdf(pdfBytes, `repaired_${files[0].name}`);
      toast.success(`PDF repaired! ${info.pages} pages recovered.`);
      setFiles([]);
    } catch {
      toast.error("Could not repair this PDF. The file may be too damaged.");
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Attempts to fix corrupted PDFs by rebuilding internal structure.
      </p>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Repairing PDF…" progress={progress} />}
      {result && (
        <div className="mt-4 rounded-lg border bg-card p-4 text-center text-sm">
          <p className="font-medium text-foreground">✅ Repair complete</p>
          <p className="text-muted-foreground">{result.pages} pages • {(result.size / 1024).toFixed(0)} KB</p>
        </div>
      )}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleRepair} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Wrench className="h-4 w-4" /> Repair & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default RepairPdf;
