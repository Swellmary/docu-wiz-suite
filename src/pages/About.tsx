import { Shield, Zap, Heart } from "lucide-react";

const About = () => (
  <div className="container max-w-2xl py-16">
    <h1 className="text-3xl font-bold mb-4">About PDFTools</h1>
    <p className="text-muted-foreground mb-8">
      PDFTools is a free, open-source suite of PDF utilities. No signup, no hidden fees — just fast, secure PDF processing right in your browser.
    </p>
    <div className="space-y-6">
      {[
        { icon: Shield, title: "Private & Secure", desc: "Files are processed locally in your browser and never uploaded to any server." },
        { icon: Zap, title: "Fast Processing", desc: "All operations run client-side using modern web technologies for instant results." },
        { icon: Heart, title: "100% Free", desc: "No accounts, no subscriptions, no limits. Every tool is completely free." },
      ].map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex gap-4 rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default About;
