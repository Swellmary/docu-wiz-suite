import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
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
import About from "./pages/About";
import GenericToolPage from "./pages/GenericToolPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<About />} />
            <Route path="/terms" element={<About />} />
            <Route path="/:toolId" element={<GenericToolPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
