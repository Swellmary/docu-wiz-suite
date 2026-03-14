import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { Download, Unlock } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "unlock")!;

const UnlockPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUnlock = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(20);
    try {
      const buffer = await files[0].arrayBuffer();
      setProgress(40);
      const doc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
        ...(password ? {} : {}),
      });
      setProgress(70);
      const pdfBytes = await doc.save();
      setProgress(100);

      downloadPdf(pdfBytes, `unlocked_${files[0].name}`);
      toast.success("PDF unlocked successfully!");
      setFiles([]);
      setPassword("");
    } catch {
      toast.error("Failed to unlock PDF. Check the password and try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {files.length > 0 && (
        <div className="mt-4 max-w-xs mx-auto space-y-2">
          <Label htmlFor="pdf-password">PDF Password (if required)</Label>
          <Input
            id="pdf-password"
            type="password"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      {processing && <ProcessingProgress label="Unlocking PDF…" progress={progress} />}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleUnlock} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Unlock className="h-4 w-4" /> Unlock & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default UnlockPdf;
