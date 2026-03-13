import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingProgressProps {
  label?: string;
  progress: number; // 0–100
}

const ProcessingProgress = ({ label = "Processing…", progress }: ProcessingProgressProps) => (
  <div className="mx-auto max-w-sm space-y-2 py-4">
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span>{label}</span>
    </div>
    <Progress value={progress} className="h-2" />
    <p className="text-center text-xs text-muted-foreground">{Math.round(progress)}%</p>
  </div>
);

export default ProcessingProgress;
