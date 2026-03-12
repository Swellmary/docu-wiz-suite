import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { tools } from "@/lib/tools";

const GenericToolPage = () => {
  const { toolId } = useParams();
  const tool = tools.find((t) => t.path === `/${toolId}`);

  if (!tool) return <div className="container py-20 text-center">Tool not found.</div>;

  return (
    <ToolPageLayout tool={tool}>
      <div className="rounded-xl border-2 border-dashed p-12 text-center">
        <Construction className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-muted-foreground text-sm">
          This tool is under development. Check back soon!
        </p>
      </div>
    </ToolPageLayout>
  );
};

export default GenericToolPage;
