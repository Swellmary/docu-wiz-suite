import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import MergePdf from "./pages/MergePdf";
import SplitPdf from "./pages/SplitPdf";
import CompressPdf from "./pages/CompressPdf";
import RotatePdf from "./pages/RotatePdf";
import WatermarkPdf from "./pages/WatermarkPdf";
import ProtectPdf from "./pages/ProtectPdf";
import JpgToPdf from "./pages/JpgToPdf";
import PageNumbersPdf from "./pages/PageNumbersPdf";
import MetadataPdf from "./pages/MetadataPdf";
import ExtractPages from "./pages/ExtractPages";
import RemovePages from "./pages/RemovePages";
import ReorderPages from "./pages/ReorderPages";
import PdfEditor from "./pages/PdfEditor";
import PdfToJpg from "./pages/PdfToJpg";
import PdfToWord from "./pages/PdfToWord";
import PdfToPpt from "./pages/PdfToPpt";
import PdfToExcel from "./pages/PdfToExcel";
import WordToPdf from "./pages/WordToPdf";
import PptToPdf from "./pages/PptToPdf";
import ExcelToPdf from "./pages/ExcelToPdf";
import RepairPdf from "./pages/RepairPdf";
import UnlockPdf from "./pages/UnlockPdf";
import PdfPreview from "./pages/PdfPreview";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import HtmlToPdf from "./pages/HtmlToPdf";
import UrlToPdf from "./pages/UrlToPdf";
import MarkdownToPdf from "./pages/MarkdownToPdf";
import CsvToPdf from "./pages/CsvToPdf";
import JsonToPdf from "./pages/JsonToPdf";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/merge" element={<MergePdf />} />
            <Route path="/split" element={<SplitPdf />} />
            <Route path="/compress" element={<CompressPdf />} />
            <Route path="/rotate" element={<RotatePdf />} />
            <Route path="/watermark" element={<WatermarkPdf />} />
            <Route path="/protect" element={<ProtectPdf />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
            <Route path="/page-numbers" element={<PageNumbersPdf />} />
            <Route path="/metadata" element={<MetadataPdf />} />
            <Route path="/extract-pages" element={<ExtractPages />} />
            <Route path="/remove-pages" element={<RemovePages />} />
            <Route path="/organize" element={<ReorderPages />} />
            <Route path="/editor" element={<PdfEditor />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/pdf-to-ppt" element={<PdfToPpt />} />
            <Route path="/pdf-to-excel" element={<PdfToExcel />} />
            <Route path="/word-to-pdf" element={<WordToPdf />} />
            <Route path="/ppt-to-pdf" element={<PptToPdf />} />
            <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
            <Route path="/repair" element={<RepairPdf />} />
            <Route path="/unlock" element={<UnlockPdf />} />
            <Route path="/preview" element={<PdfPreview />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<About />} />
            <Route path="/terms" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
