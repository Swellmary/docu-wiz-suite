import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { PdfTool } from "@/lib/tools";

interface ToolPageLayoutProps {
  tool: PdfTool;
  children: ReactNode;
}

const colorMap: Record<string, string> = {
  "tool-merge": "bg-tool-merge/10 text-tool-merge",
  "tool-convert": "bg-tool-convert/10 text-tool-convert",
  "tool-edit": "bg-tool-edit/10 text-tool-edit",
  "tool-security": "bg-tool-security/10 text-tool-security",
  "tool-optimize": "bg-tool-optimize/10 text-tool-optimize",
  "tool-webdata": "bg-tool-webdata/10 text-tool-webdata",
};

const ToolPageLayout = ({ tool, children }: ToolPageLayoutProps) => (
  <div className="container max-w-3xl py-8">
    <Link to="/">
      <Button variant="ghost" size="sm" className="mb-6 gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to all tools
      </Button>
    </Link>
    <div className="mb-8 text-center">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${colorMap[tool.color]}`}>
        <tool.icon className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold">{tool.name}</h1>
      <p className="mt-2 text-muted-foreground">{tool.description}</p>
    </div>
    {children}
  </div>
);

export default ToolPageLayout;
