import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tools, categoryLabels, ToolCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const location = useLocation();

  const categories = Object.keys(categoryLabels) as ToolCategory[];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>PDF<span className="text-gradient-hero">Tools</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "secondary" : "ghost"} size="sm">Home</Button>
          </Link>
          <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <Button variant="ghost" size="sm" className="gap-1">
              All Tools <ChevronDown className="h-3 w-3" />
            </Button>
            {toolsOpen && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                <div className="grid w-[640px] grid-cols-3 gap-4 rounded-xl border bg-card p-5 shadow-lg">
                  {categories.map(cat => (
                    <div key={cat}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryLabels[cat]}
                      </p>
                      <div className="space-y-0.5">
                        {tools.filter(t => t.category === cat).map(tool => (
                          <Link
                            key={tool.id}
                            to={tool.path}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                            onClick={() => setToolsOpen(false)}
                          >
                            <tool.icon className={cn("h-4 w-4", `text-${tool.color}`)} />
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {["merge", "split", "compress"].map(id => {
            const tool = tools.find(t => t.id === id)!;
            return (
              <Link key={id} to={tool.path}>
                <Button variant={location.pathname === tool.path ? "secondary" : "ghost"} size="sm">
                  {tool.name}
                </Button>
              </Link>
            );
          })}
          <Link to="/about">
            <Button variant={location.pathname === "/about" ? "secondary" : "ghost"} size="sm">About</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Home</Button>
            </Link>
            {tools.slice(0, 8).map(tool => (
              <Link key={tool.id} to={tool.path} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <tool.icon className="h-4 w-4" /> {tool.name}
                </Button>
              </Link>
            ))}
            <Link to="/about" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">About</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
