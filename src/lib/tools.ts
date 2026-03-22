import {
  FileStack, Scissors, Trash2, FileOutput, GripVertical,
  FileText, Presentation, Sheet, Image,
  FileDown, Minimize2, RotateCw, Droplets, Hash,
  Wrench, Unlock, Lock, Info, Edit, Eye,
  Globe, Link, Type, Table2, Braces, Github,
} from "lucide-react";

export type ToolCategory = "organize" | "manage" | "convert" | "edit" | "security" | "webdata" | "devtools" | "extra";

export interface PdfTool {
  id: string;
  name: string;
  description: string;
  icon: typeof FileStack;
  category: ToolCategory;
  path: string;
  color: string;
}

export const tools: PdfTool[] = [
  // PDF Organization Tools
  { id: "merge", name: "Merge PDF", description: "Combine multiple PDFs into one", icon: FileStack, category: "organize", path: "/merge", color: "tool-merge" },
  { id: "split", name: "Split PDF", description: "Split by page range or extract individual pages", icon: Scissors, category: "organize", path: "/split", color: "tool-merge" },
  { id: "extract-pages", name: "Extract Pages", description: "Select specific pages and export as new PDF", icon: FileOutput, category: "organize", path: "/extract-pages", color: "tool-merge" },
  { id: "remove-pages", name: "Delete Pages", description: "Remove specific pages from your PDF", icon: Trash2, category: "organize", path: "/remove-pages", color: "tool-merge" },
  { id: "organize", name: "Reorder Pages", description: "Drag & drop page reordering", icon: GripVertical, category: "organize", path: "/organize", color: "tool-merge" },
  { id: "rotate", name: "Rotate Pages", description: "Rotate selected pages 90° or 180°", icon: RotateCw, category: "organize", path: "/rotate", color: "tool-merge" },

  // Conversion
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages to images", icon: Image, category: "convert", path: "/pdf-to-jpg", color: "tool-convert" },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert images to PDF", icon: FileText, category: "convert", path: "/jpg-to-pdf", color: "tool-convert" },
  { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to DOCX format", icon: FileText, category: "convert", path: "/pdf-to-word", color: "tool-convert" },
  { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Convert PDF to PPTX", icon: Presentation, category: "convert", path: "/pdf-to-ppt", color: "tool-convert" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Convert PDF to XLSX", icon: Sheet, category: "convert", path: "/pdf-to-excel", color: "tool-convert" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX to PDF", icon: FileDown, category: "convert", path: "/word-to-pdf", color: "tool-convert" },
  { id: "ppt-to-pdf", name: "PPT to PDF", description: "Convert PPTX to PDF", icon: FileDown, category: "convert", path: "/ppt-to-pdf", color: "tool-convert" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX to PDF", icon: FileDown, category: "convert", path: "/excel-to-pdf", color: "tool-convert" },

  // Web & Data to PDF
  { id: "html-to-pdf", name: "HTML to PDF", description: "Convert HTML code or files to PDF", icon: Globe, category: "webdata", path: "/html-to-pdf", color: "tool-webdata" },
  { id: "url-to-pdf", name: "URL to PDF", description: "Convert any webpage to PDF", icon: Link, category: "webdata", path: "/url-to-pdf", color: "tool-webdata" },
  { id: "markdown-to-pdf", name: "Markdown to PDF", description: "Convert Markdown text to styled PDF", icon: Type, category: "webdata", path: "/markdown-to-pdf", color: "tool-webdata" },
  { id: "csv-to-pdf", name: "CSV to PDF", description: "Convert CSV data to formatted PDF table", icon: Table2, category: "webdata", path: "/csv-to-pdf", color: "tool-webdata" },
  { id: "json-to-pdf", name: "JSON to PDF", description: "Convert JSON data to readable PDF", icon: Braces, category: "webdata", path: "/json-to-pdf", color: "tool-webdata" },

  // Developer Tools
  { id: "github-to-pdf", name: "GitHub Repo to PDF", description: "Convert GitHub repository docs to PDF", icon: Github, category: "devtools", path: "/github-to-pdf", color: "tool-devtools" },

  // Editing
  { id: "compress", name: "Compress PDF", description: "Reduce PDF file size", icon: Minimize2, category: "edit", path: "/compress", color: "tool-edit" },
  { id: "watermark", name: "Add Watermark", description: "Stamp text on your PDF", icon: Droplets, category: "edit", path: "/watermark", color: "tool-edit" },
  { id: "page-numbers", name: "Page Numbers", description: "Add page numbers to your PDF", icon: Hash, category: "edit", path: "/page-numbers", color: "tool-edit" },
  { id: "repair", name: "Repair PDF", description: "Try to fix corrupted PDFs", icon: Wrench, category: "edit", path: "/repair", color: "tool-edit" },

  // Security
  { id: "unlock", name: "Unlock PDF", description: "Remove PDF password", icon: Unlock, category: "security", path: "/unlock", color: "tool-security" },
  { id: "protect", name: "Protect PDF", description: "Add password protection", icon: Lock, category: "security", path: "/protect", color: "tool-security" },

  // Extra
  { id: "metadata", name: "PDF Metadata", description: "View PDF file information", icon: Info, category: "extra", path: "/metadata", color: "tool-optimize" },
  { id: "editor", name: "PDF Editor", description: "Add text annotations", icon: Edit, category: "extra", path: "/editor", color: "tool-optimize" },
  { id: "preview", name: "PDF Preview", description: "Preview your PDF file", icon: Eye, category: "extra", path: "/preview", color: "tool-optimize" },
];

export const popularTools = tools.filter(t =>
  ["merge", "split", "compress", "pdf-to-jpg", "jpg-to-pdf", "rotate", "watermark", "protect"].includes(t.id)
);

export const categoryLabels: Record<ToolCategory, string> = {
  organize: "PDF Organization Tools",
  manage: "PDF Management",
  convert: "PDF Conversion",
  webdata: "Web & Data to PDF",
  devtools: "Developer Tools",
  edit: "PDF Editing",
  security: "Security",
  extra: "Additional Tools",
};
