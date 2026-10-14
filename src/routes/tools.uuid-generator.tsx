import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Copy, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/uuid-generator")({
  head: () => ({
    meta: [
      { title: "Free UUID v4 Generator Online — DevOS" },
      {
        name: "description",
        content:
          "Generate cryptographically secure version-4 UUIDs online in bulk with DevOS. Uppercase, lowercase, hyphens toggle, and one-click copy.",
      },
      { property: "og:title", content: "Free UUID v4 Generator Online — DevOS" },
      {
        property: "og:description",
        content:
          "Generate cryptographically secure version-4 UUIDs online in bulk with DevOS. Uppercase, lowercase, hyphens toggle, and one-click copy.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/tools/uuid-generator" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free UUID v4 Generator Online — DevOS" },
      {
        name: "twitter:description",
        content:
          "Generate cryptographically secure version-4 UUIDs online in bulk with DevOS. Uppercase, lowercase, hyphens toggle, and one-click copy.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/tools/uuid-generator",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free Online UUID v4 Generator",
          url: "https://www.dev-os.app/tools/uuid-generator",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description:
            "Generate cryptographically secure RFC 4122 version 4 UUIDs in bulk. Browser crypto API based, fast, and free.",
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
              name: "UUID Generator",
              item: "https://www.dev-os.app/tools/uuid-generator",
            },
          ],
        }),
      },
    ],
  }),
  component: UuidGeneratorPage,
});

function generateSingleUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function UuidGeneratorPage() {
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generateBatch = () => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let id = generateSingleUuid();
      if (!hyphens) {
        id = id.replace(/-/g, "");
      }
      if (uppercase) {
        id = id.toUpperCase();
      } else {
        id = id.toLowerCase();
      }
      list.push(id);
    }
    setUuids(list);
  };

  useEffect(() => {
    generateBatch();
  }, [count, uppercase, hyphens]);

  const handleCopyAll = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join("\n"));
    setCopied(true);
    toast.success(`Copied ${uuids.length} UUID(s) to clipboard!`);
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
            <span className="text-emerald-400 font-semibold">UUID Generator</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Zap className="size-3.5" />
              <span>CRYPTOGRAPHICALLY SECURE RFC 4122 V4</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Free UUID v4 Generator Online
            </h1>
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed bg-card/60 border border-emerald-500/20 p-5 rounded-xl">
              DevOS UUID Generator is a free online tool that generates cryptographically secure
              Version-4 UUIDs and GUIDs using standard browser Web Crypto APIs. It allows developers to
              generate single or bulk batches of unique identifiers with customizable formatting options
              like casing and hyphenation.
            </p>
          </div>

          {/* Interactive Tool Area */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-sm space-y-5 shadow-xl">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">Quantity:</span>
                {[1, 5, 10, 25, 50].map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant={count === num ? "default" : "outline"}
                    onClick={() => setCount(num)}
                    className={`text-xs h-7 px-3 ${
                      count === num ? "bg-emerald-500 text-black font-semibold hover:bg-emerald-600" : "border-border/60"
                    }`}
                  >
                    {num}
                  </Button>
                ))}

                <label className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground ml-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="rounded border-border/60"
                  />
                  <span>Uppercase</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground ml-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={(e) => setHyphens(e.target.checked)}
                    className="rounded border-border/60"
                  />
                  <span>Hyphens</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateBatch}
                  className="text-xs h-8 border-border/60 hover:bg-muted/40"
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopyAll}
                  className="text-xs h-8 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                >
                  {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
                  {copied ? "Copied All!" : "Copy All"}
                </Button>
              </div>
            </div>

            {/* Generated UUID List */}
            <div className="space-y-2">
              <div className="rounded-lg bg-background/60 border border-border/40 p-4 space-y-2 font-mono text-xs max-h-80 overflow-y-auto">
                {uuids.map((id, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 py-1.5 px-3 rounded bg-card/60 border border-border/20 hover:border-emerald-500/40 transition-colors"
                  >
                    <span className="text-emerald-300 font-medium truncate">{id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(id);
                        toast.success("UUID copied!");
                      }}
                      className="text-muted-foreground hover:text-foreground text-[11px] shrink-0"
                      title="Copy this UUID"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DevOS Promotion Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground">Stop Juggling Developer Utilities</h3>
              <p className="text-xs text-muted-foreground">
                DevOS integrates coding stats, job applications, technical notes, and dev tools into one tab.
              </p>
            </div>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shrink-0">
                <span>Start DevOS Free</span>
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

