import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, Loader2 } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  exporting: boolean;
}

export interface ExportOptions {
  addWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  compress: boolean;
}

export default function ExportDialog({ open, onClose, onExport, exporting }: ExportDialogProps) {
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState("DRAFT");
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [compress, setCompress] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="watermark">Add Watermark</Label>
            <Switch id="watermark" checked={addWatermark} onCheckedChange={setAddWatermark} />
          </div>
          {addWatermark && (
            <div className="space-y-3 pl-2 border-l-2 border-primary/20">
              <div>
                <Label className="text-xs">Text</Label>
                <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Watermark text" />
              </div>
              <div>
                <Label className="text-xs">Opacity: {watermarkOpacity}%</Label>
                <Slider value={[watermarkOpacity]} onValueChange={([v]) => setWatermarkOpacity(v)} min={5} max={80} step={5} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="compress">Compress output</Label>
            <Switch id="compress" checked={compress} onCheckedChange={setCompress} />
          </div>
          <Button
            className="w-full gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90"
            onClick={() => onExport({ addWatermark, watermarkText, watermarkOpacity, compress })}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Exporting…" : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
