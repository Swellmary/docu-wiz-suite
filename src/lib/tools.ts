import {
  FileStack, Scissors, Trash2, FileOutput, GripVertical,
  FileText, Presentation, Sheet, Image,
  FileDown, Minimize2, RotateCw, Droplets, Hash,
  Wrench, Unlock, Lock, Info, Edit, Eye,
} from "lucide-react";

export type ToolCategory = "organize" | "manage" | "convert" | "edit" | "security" | "extra";

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
  // Management
  { id: "merge", name: "Merge PDF", description: "Combine multiple PDFs into one", icon: FileStack, category: "manage", path: "/merge", color: "tool-merge" },
  { id: "split", name: "Split PDF", description: "Separate a PDF into individual pages", icon: Scissors, category: "manage", path: "/split", color: "tool-merge" },
  { id: "remove-pages", name: "Remove Pages", description: "Delete pages from your PDF", icon: Trash2, category: "manage", path: "/remove-pages", color: "tool-merge" },
  { id: "extract-pages", name: "Extract Pages", description: "Pull out specific pages", icon: FileOutput, category: "manage", path: "/extract-pages", color: "tool-merge" },
  { id: "organize", name: "Organize Pages", description: "Reorder PDF pages with drag & drop", icon: GripVertical, category: "manage", path: "/organize", color: "tool-merge" },

  // Conversion
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages to images", icon: Image, category: "convert", path: "/pdf-to-jpg", color: "tool-convert" },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert images to PDF", icon: FileText, category: "convert", path: "/jpg-to-pdf", color: "tool-convert" },
  { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to DOCX format", icon: FileText, category: "convert", path: "/pdf-to-word", color: "tool-convert" },
  { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Convert PDF to PPTX", icon: Presentation, category: "convert", path: "/pdf-to-ppt", color: "tool-convert" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Convert PDF to XLSX", icon: Sheet, category: "convert", path: "/pdf-to-excel", color: "tool-convert" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX to PDF", icon: FileDown, category: "convert", path: "/word-to-pdf", color: "tool-convert" },
  { id: "ppt-to-pdf", name: "PPT to PDF", description: "Convert PPTX to PDF", icon: FileDown, category: "convert", path: "/ppt-to-pdf", color: "tool-convert" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX to PDF", icon: FileDown, category: "convert", path: "/excel-to-pdf", color: "tool-convert" },

  // Editing
  { id: "compress", name: "Compress PDF", description: "Reduce PDF file size", icon: Minimize2, category: "edit", path: "/compress", color: "tool-edit" },
  { id: "rotate", name: "Rotate PDF", description: "Rotate PDF pages", icon: RotateCw, category: "edit", path: "/rotate", color: "tool-edit" },
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
  manage: "PDF Management",
  convert: "PDF Conversion",
  edit: "PDF Editing",
  security: "Security",
  extra: "Additional Tools",
};
