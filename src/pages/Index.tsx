import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ToolCard from "@/components/ToolCard";
import { tools, popularTools, categoryLabels, ToolCategory } from "@/lib/tools";

const Index = () => {
  const categories = Object.keys(categoryLabels) as ToolCategory[];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-hero-soft py-20 md:py-28">
        <div className="container text-center">
          <motion.h1
            className="text-4xl font-extrabold leading-tight md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Every tool you need to
            <br />
            <span className="text-gradient-hero">work with PDFs</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Merge, split, compress, convert, rotate, watermark, and much more.
            100% free, no signup required.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/merge">
              <Button size="lg" className="gap-2 bg-gradient-hero hover:opacity-90 text-primary-foreground">
                Merge PDF <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/compress">
              <Button size="lg" variant="outline" className="gap-2">
                Compress PDF
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Popular tools */}
      <section className="container py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">Popular Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {popularTools.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* All tools by category */}
      <section className="border-t bg-accent/30 py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold">All PDF Tools</h2>
          {categories.map((cat) => (
            <div key={cat} className="mb-10">
              <h3 className="mb-4 text-lg font-semibold text-muted-foreground">
                {categoryLabels[cat]}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {tools.filter((t) => t.category === cat).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy banner */}
      <section className="container py-16 text-center">
        <div className="mx-auto max-w-lg rounded-2xl bg-gradient-hero-soft p-8">
          <h3 className="text-xl font-bold mb-2">Your files are safe</h3>
          <p className="text-sm text-muted-foreground">
            All processing happens in your browser. Files are never uploaded to any server
            and are automatically deleted after you're done.
          </p>
        </div>
      </section>
    </>
  );
};

export default Index;
