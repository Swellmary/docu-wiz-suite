import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolPageLayout from "@/components/ToolPageLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingProgress from "@/components/ProcessingProgress";
import { tools } from "@/lib/tools";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const tool = tools.find((t) => t.id === "pdf-to-word")!;

const PdfToWord = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    try {
      const buffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total = pdf.numPages;
      const textParts: string[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(" ");
        textParts.push(`--- Page ${i} ---\n${pageText}\n`);
        setProgress(Math.round((i / total) * 100));
      }

      const blob = new Blob([textParts.join("\n")], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(".pdf", ".txt");
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Text extracted from PDF!");
      setFiles([]);
    } catch {
      toast.error("Failed to extract text from PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Extracts text content from your PDF. Complex formatting and images are not preserved.
      </p>
      <FileUpload accept=".pdf" files={files} onFilesSelected={(f) => setFiles(f.slice(0, 1))} onRemoveFile={() => setFiles([])} />
      {processing && <ProcessingProgress label="Extracting text…" progress={progress} />}
      {files.length > 0 && !processing && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleConvert} className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
            <Download className="h-4 w-4" /> Extract Text & Download
          </Button>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default PdfToWord;
