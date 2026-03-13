import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

export default function SignatureDialog({ open, onClose, onConfirm }: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [tab, setTab] = useState("draw");

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current!.getContext("2d")!;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      const rect = canvasRef.current!.getBoundingClientRect();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    },
    [isDrawing]
  );

  const endDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const confirmDraw = () => {
    if (!canvasRef.current) return;
    onConfirm(canvasRef.current.toDataURL("image/png"));
    onClose();
  };

  const confirmType = () => {
    if (!typedText.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "italic 36px 'Georgia', serif";
    ctx.fillStyle = "#000";
    ctx.fillText(typedText, 10, 60);
    onConfirm(canvas.toDataURL("image/png"));
    onClose();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onConfirm(reader.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="draw" className="flex-1">Draw</TabsTrigger>
            <TabsTrigger value="type" className="flex-1">Type</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3">
            <canvas
              ref={canvasRef}
              width={400}
              height={120}
              className="w-full border rounded-lg bg-card cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
              <Button size="sm" onClick={confirmDraw}>Use Signature</Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-3">
            <Input
              placeholder="Type your signature..."
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="text-2xl italic font-serif"
            />
            {typedText && (
              <div className="p-4 border rounded-lg bg-card text-center">
                <span className="text-3xl italic" style={{ fontFamily: "'Georgia', serif" }}>{typedText}</span>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={confirmType} disabled={!typedText.trim()}>Use Signature</Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">Upload a signature image</p>
              <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
