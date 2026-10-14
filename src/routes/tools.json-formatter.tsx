import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Copy, FileJson, RefreshCw, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/json-formatter")({
  head: () => ({
    meta: [
      { title: "Free JSON Formatter & Validator Online — DevOS" },
      {
        name: "description",
        content:
          "Format, validate, beautify, and minify JSON data instantly in your browser with DevOS. 100% private, client-side, with zero login required.",
      },
      { property: "og:title", content: "Free JSON Formatter & Validator Online — DevOS" },
      {
        property: "og:description",
        content:
          "Format, validate, beautify, and minify JSON data instantly in your browser with DevOS. 100% private, client-side, with zero login required.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/tools/json-formatter" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free JSON Formatter & Validator Online — DevOS" },
      {
        name: "twitter:description",
        content:
          "Format, validate, beautify, and minify JSON data instantly in your browser with DevOS. 100% private, client-side, with zero login required.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/tools/json-formatter",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free JSON Formatter and Validator Online",
          url: "https://www.dev-os.app/tools/json-formatter",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description:
            "Format, validate, beautify, and minify JSON code instantly in your browser. Client-side, fast, and completely private.",
          author: {
            "@type": "Organization",
            name: "DevOS",
            url: "https://www.dev-os.app/",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.dev-os.app/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Dev Tools",
              item: "https://www.dev-os.app/tools",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "JSON Formatter",
              item: "https://www.dev-os.app/tools/json-formatter",
            },
          ],
        }),
      },
    ],
  }),
  component: JsonFormatterPage,
});

const SAMPLE_JSON = `{
  "name": "DevOS Workspace",
  "version": "2.0.0",
  "modules": ["notes", "coding-profiles", "projects", "job-tracker"],
  "settings": {
    "theme": "dark",
    "telemetry": false
  }
}`;

function JsonFormatterPage() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  const formatJson = (spacing: number) => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, spacing));
      toast.success(spacing === 0 ? "JSON minified!" : "JSON formatted successfully!");
    } catch (err: any) {
      setError(err?.message || "Invalid JSON syntax");
      toast.error("Invalid JSON syntax");
    }
  };

  const handleCopy = () => {
    const textToCopy = output || input;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/tools" className="hover:text-foreground transition-colors">
              Tools
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">JSON Formatter</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Zap className="size-3.5" />
              <span>100% PRIVATE • CLIENT-SIDE ONLY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Free JSON Formatter & Validator Online
            </h1>
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed bg-card/60 border border-emerald-500/20 p-5 rounded-xl">
              DevOS Free JSON Formatter is an instant, privacy-first online tool that validates,
              beautifies, and minifies JSON code entirely inside your browser. No data ever leaves
              your computer, making it completely secure for API payloads, private keys, and database
              dumps.
            </p>
          </div>

          {/* Interactive Tool Area */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-sm space-y-4 shadow-xl">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => formatJson(2)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-8"
                >
                  Beautify (2 Spaces)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => formatJson(4)}
                  className="text-xs h-8 border-border/60"
                >
                  4 Spaces
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => formatJson(0)}
                  className="text-xs h-8 border-border/60"
                >
                  Minify
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInput(SAMPLE_JSON);
                    setOutput("");
                    setError(null);
                  }}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Load Sample
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInput("");
                    setOutput("");
                    setError(null);
                  }}
                  className="text-xs h-8 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-xs h-8 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy Output"}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/40 px-4 py-2.5 text-xs text-red-300 font-mono">
                <span className="font-bold">JSON Syntax Error:</span> {error}
              </div>
            )}

            {/* Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground">
                  Input Raw JSON:
                </label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste raw unformatted or minified JSON here..."
                  className="h-80 font-mono text-xs bg-background/80 border-border/50 resize-y leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground">
                  Formatted / Validated Output:
                </label>
                <Textarea
                  value={output}
                  readOnly
                  placeholder="Formatted JSON output will appear here..."
                  className="h-80 font-mono text-xs bg-background/40 border-border/50 resize-y leading-relaxed text-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Educational Content / Keyword Enrichment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-2">
              <h2 className="text-base font-bold text-foreground">Why Use a Client-Side JSON Formatter?</h2>
              <p className="leading-relaxed">
                Many online JSON formatters upload your payload to third-party servers. DevOS parses JSON
                entirely in your client's JavaScript runtime, ensuring that tokens, customer data, and
                credentials never leak across the network.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-2">
              <h2 className="text-base font-bold text-foreground">Built Into DevOS Hub</h2>
              <p className="leading-relaxed">
                DevOS provides built-in utilities alongside your daily developer notes, LeetCode profile
                tracker, and active projects so you never need to search the web for one-off dev tools again.
              </p>
            </div>
          </div>

          {/* DevOS Promotion Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground">Need a Complete Developer Workspace?</h3>
              <p className="text-xs text-muted-foreground">
                Track your coding profiles, job applications, technical notes, and active side projects in one place.
              </p>
            </div>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shrink-0">
                <span>Explore DevOS Free</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

