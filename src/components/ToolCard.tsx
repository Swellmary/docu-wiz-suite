import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PdfTool } from "@/lib/tools";

const colorMap: Record<string, string> = {
  "tool-merge": "bg-tool-merge/10 text-tool-merge",
  "tool-convert": "bg-tool-convert/10 text-tool-convert",
  "tool-edit": "bg-tool-edit/10 text-tool-edit",
  "tool-security": "bg-tool-security/10 text-tool-security",
  "tool-optimize": "bg-tool-optimize/10 text-tool-optimize",
};

const ToolCard = ({ tool }: { tool: PdfTool }) => (
  <Link
    to={tool.path}
    className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1"
  >
    <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110", colorMap[tool.color])}>
      <tool.icon className="h-7 w-7" />
    </div>
    <h3 className="font-semibold text-sm">{tool.name}</h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
  </Link>
);

export default ToolCard;
