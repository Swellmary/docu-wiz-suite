import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "protect")!;

const ProtectPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleProtect = async () => {
    if (!files.length || !password) return;
    setProcessing(true);
    try {
      // pdf-lib doesn't support encryption natively, so we inform the user
      toast.info("Password protection requires server-side processing. This is a demo — the file will download without encryption. Full encryption support coming soon!");
      const blob = new Blob([await files[0].arrayBuffer()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `protected_${files[0].name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to process PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        files={files}
        onFilesSelected={(f) => setFiles(f.slice(0, 1))}
        onRemoveFile={() => setFiles([])}
      />
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="mx-auto max-w-sm">
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <div className="flex justify-center">
            <Button size="lg" disabled={processing || !password} onClick={handleProtect} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {processing ? "Processing…" : "Protect & Download"}
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ProtectPdf;
