import { Link } from "react-router-dom";
import { FileText, MessageSquare } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

const Footer = () => (
  <footer className="border-t bg-card">
    <div className="container py-12">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            PDF<span className="text-gradient-hero">Tools</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Free online PDF tools. No signup required.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Popular Tools</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/merge" className="hover:text-foreground transition-colors">Merge PDF</Link>
            <Link to="/split" className="hover:text-foreground transition-colors">Split PDF</Link>
            <Link to="/compress" className="hover:text-foreground transition-colors">Compress PDF</Link>
            <Link to="/pdf-to-jpg" className="hover:text-foreground transition-colors">PDF to JPG</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">More Tools</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/rotate" className="hover:text-foreground transition-colors">Rotate PDF</Link>
            <Link to="/watermark" className="hover:text-foreground transition-colors">Add Watermark</Link>
            <Link to="/protect" className="hover:text-foreground transition-colors">Protect PDF</Link>
            <Link to="/jpg-to-pdf" className="hover:text-foreground transition-colors">JPG to PDF</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <FeedbackDialog trigger={
              <button className="text-left hover:text-foreground transition-colors flex items-center gap-1.5 focus:outline-none">
                Feedback
              </button>
            } />
          </div>
        </div>
      </div>
      <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PDFTools. All files are processed securely and deleted after download.
      </div>
    </div>
  </footer>
);

export default Footer;
