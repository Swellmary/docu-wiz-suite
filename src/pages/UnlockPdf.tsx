import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner";
import { Unlock, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const tool = tools.find((t) => t.id === "unlock")!;

type UnlockStatus = "idle" | "needs-password" | "ready";

const UnlockPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UnlockStatus>("idle");
  const [pageCount, setPageCount] = useState(0);
  const bufferRef = useRef<ArrayBuffer | null>(null);

  const handleFilesSelected = async (selected: File[]) => {
    const file = selected[0];
    if (!file) return;
    setFiles([file]);
    setPassword("");
    setStatus("idle");

    try {
      const buffer = await file.arrayBuffer();
      bufferRef.current = buffer;

      // Try loading without password to check if encrypted
      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        setPageCount(pdfDoc.numPages);
        setStatus("ready"); // Not encrypted or only owner-password restricted
      } catch (err: any) {
        if (err?.name === "PasswordException") {
          setStatus("needs-password");
          toast.info("This PDF is password-protected. Enter the password to unlock.");
        } else {
          toast.error("Could not read this PDF file.");
        }
      }
    } catch {
      toast.error("Failed to read file.");
    }
  };

  const tryPassword = async () => {
    if (!bufferRef.current || !password) return;
    try {
      const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(bufferRef.current),
        password,
      }).promise;
      setPageCount(pdfDoc.numPages);
      setStatus("ready");
      toast.success("Password accepted!");
    } catch (err: any) {
      if (err?.name === "PasswordException") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error("Failed to decrypt PDF.");
      }
    }
  };

  const handleUnlock = async () => {
    if (!bufferRef.current) return;
    setProcessing(true);
    setProgress(10);
    try {
      const buffer = bufferRef.current;
      setProgress(20);

      // Use PDF.js to render each page, then rebuild with pdf-lib
      // This strips all encryption by creating a fresh PDF from rendered content
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        ...(password ? { password } : {}),
      });
      const pdfDoc = await loadingTask.promise;
      setProgress(30);

      // Try the fast path: load with pdf-lib ignoreEncryption
      try {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        setProgress(80);
        const pdfBytes = await doc.save();
        setProgress(100);
        downloadPdf(pdfBytes, `unlocked_${files[0].name}`);
        toast.success(`PDF unlocked successfully! (${pdfDoc.numPages} pages)`);
      } catch {
        // Fallback: render pages as images and rebuild PDF
        setProgress(40);
        const newDoc = await PDFDocument.create();
        const totalPages = pdfDoc.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;

          const imgData = canvas.toDataURL("image/png");
          const imgBytes = Uint8Array.from(atob(imgData.split(",")[1]), (c) => c.charCodeAt(0));
          const img = await newDoc.embedPng(imgBytes);

          const newPage = newDoc.addPage([viewport.width / 2, viewport.height / 2]);
          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: viewport.width / 2,
            height: viewport.height / 2,
          });

          setProgress(40 + Math.round((i / totalPages) * 50));
        }

        const pdfBytes = await newDoc.save();
        setProgress(100);
        downloadPdf(pdfBytes, `unlocked_${files[0].name}`);
        toast.success(`PDF unlocked successfully! (${totalPages} pages)`);
      }

      setFiles([]);
      setPassword("");
      setStatus("idle");
      bufferRef.current = null;
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlock PDF. Check the password and try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <FileUpload
        accept=".pdf"
        files={files}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={() => {
          setFiles([]);
          setStatus("idle");
          setPassword("");
          bufferRef.current = null;
        }}
      />

      {files.length > 0 && (
        <div className="mt-6 mx-auto max-w-md space-y-5">
          {/* Status indicator */}
          {status === "ready" && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>PDF loaded — {pageCount} page{pageCount !== 1 ? "s" : ""} detected. Ready to unlock.</span>
            </div>
          )}

          {/* Password input for encrypted PDFs */}
          {status === "needs-password" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="unlock-pw">PDF Password</Label>
                <div className="relative">
                  <Input
                    id="unlock-pw"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the PDF password"
                    onKeyDown={(e) => e.key === "Enter" && tryPassword()}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={tryPassword} disabled={!password} variant="outline" className="w-full">
                Verify Password
              </Button>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>Decryption happens entirely in your browser. Your file and password never leave your device.</span>
          </div>

          {processing && <ProcessingProgress label="Unlocking PDF…" progress={progress} />}

          {status === "ready" && !processing && (
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={handleUnlock}
                className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                <Unlock className="h-4 w-4" /> Unlock & Download
              </Button>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
};

export default UnlockPdf;
