import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { toast } from "sonner";
import { Download, Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

const tool = tools.find((t) => t.id === "protect")!;

const ProtectPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useOwnerPassword, setUseOwnerPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const passwordsMatch = userPassword === confirmPassword;
  const isValid = files.length > 0 && userPassword.length >= 1 && passwordsMatch;

  const getStrength = (pw: string) => {
    if (pw.length === 0) return { label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-destructive" };
    if (score <= 3) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength(userPassword);

  const handleProtect = async () => {
    if (!isValid) return;
    setProcessing(true);
    setProgress(10);
    try {
      const buffer = await files[0].arrayBuffer();
      setProgress(30);

      // Load and re-save with pdf-lib to normalize the PDF first
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const cleanBytes = await doc.save();
      setProgress(50);

      // Encrypt using RC4 128-bit encryption
      const encryptedBytes = await encryptPDF(
        cleanBytes,
        userPassword,
        useOwnerPassword && ownerPassword ? ownerPassword : undefined
      );
      setProgress(90);

      downloadPdf(new Uint8Array(encryptedBytes), `protected_${files[0].name}`);
      setProgress(100);
      toast.success("PDF protected with password successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to protect PDF. The file may be corrupted or unsupported.");
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
        <div className="mt-6 mx-auto max-w-md space-y-5">
          {/* User password */}
          <div className="space-y-2">
            <Label htmlFor="user-pw">Password</Label>
            <div className="relative">
              <Input
                id="user-pw"
                type={showPassword ? "text" : "password"}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Enter password to protect PDF"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {userPassword && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: strength.label === "Weak" ? "33%" : strength.label === "Medium" ? "66%" : "100%" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm Password</Label>
            <Input
              id="confirm-pw"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          {/* Optional owner password */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="owner-pw-toggle"
              checked={useOwnerPassword}
              onCheckedChange={(v) => setUseOwnerPassword(!!v)}
            />
            <Label htmlFor="owner-pw-toggle" className="text-sm cursor-pointer">
              Set separate owner password (for editing restrictions)
            </Label>
          </div>
          {useOwnerPassword && (
            <div className="space-y-2">
              <Label htmlFor="owner-pw">Owner Password</Label>
              <Input
                id="owner-pw"
                type={showPassword ? "text" : "password"}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Owner password"
              />
            </div>
          )}

          {/* Security info */}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>Your file is encrypted with RC4 128-bit directly in your browser. It never leaves your device.</span>
          </div>

          {processing && <ProcessingProgress label="Encrypting PDF…" progress={progress} />}

          {!processing && (
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                disabled={!isValid}
                onClick={handleProtect}
                className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                <Lock className="h-4 w-4" /> Protect & Download
              </Button>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ProtectPdf;
