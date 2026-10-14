import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Copy, RefreshCw, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/base64")({
  head: () => ({
    meta: [
      { title: "Free Base64 Encoder & Decoder Online — DevOS" },
      {
        name: "description",
        content:
          "Encode and decode text to Base64 and Base64URL securely in your browser with DevOS. Free, fast, private, and requires no account.",
      },
      { property: "og:title", content: "Free Base64 Encoder & Decoder Online — DevOS" },
      {
        property: "og:description",
        content:
          "Encode and decode text to Base64 and Base64URL securely in your browser with DevOS. Free, fast, private, and requires no account.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/tools/base64" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free Base64 Encoder & Decoder Online — DevOS" },
      {
        name: "twitter:description",
        content:
          "Encode and decode text to Base64 and Base64URL securely in your browser with DevOS. Free, fast, private, and requires no account.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/tools/base64",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free Online Base64 Encoder and Decoder",
          url: "https://www.dev-os.app/tools/base64",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description:
            "Encode and decode text strings to standard Base64 and Base64URL format online. Runs completely client-side in browser.",
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
              name: "Base64 Encoder & Decoder",
              item: "https://www.dev-os.app/tools/base64",
            },
          ],
        }),
      },
    ],
  }),
  component: Base64ToolPage,
});

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function base64ToUtf8(str: string): string {
  const cleanStr = str.replace(/-/g, "+").replace(/_/g, "/");
  const binString = atob(cleanStr);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function Base64ToolPage() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Hello, DevOS Workspace! 🚀");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);

  const processText = (currentMode: "encode" | "decode", currentInput: string, isUrlSafe: boolean) => {
    setError(null);
    if (!currentInput.trim()) {
      setOutput("");
      return;
    }

    try {
      if (currentMode === "encode") {
        let res = utf8ToBase64(currentInput);
        if (isUrlSafe) {
          res = res.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        setOutput(res);
      } else {
        const res = base64ToUtf8(currentInput.trim());
        setOutput(res);
      }
    } catch (err: any) {
      setError(err?.message || "Invalid Base64 string for decoding");
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    processText(mode, val, urlSafe);
  };

  const switchMode = (newMode: "encode" | "decode") => {
    setMode(newMode);
    setError(null);
    if (output) {
      const nextInput = output;
      setInput(nextInput);
      processText(newMode, nextInput, urlSafe);
    } else {
      processText(newMode, input, urlSafe);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
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
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/tools" className="hover:text-foreground transition-colors">
              Tools
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">Base64</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Zap className="size-3.5" />
              <span>UTF-8 & BASE64URL SAFE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Free Base64 Encoder & Decoder Online
            </h1>
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed bg-card/60 border border-emerald-500/20 p-5 rounded-xl">
              DevOS Base64 Encoder & Decoder is a fast, client-side developer utility for converting
              UTF-8 strings and auth tokens to and from standard Base64 and Base64URL formats. All
              conversions execute entirely in your browser, guaranteeing confidential tokens and
              strings remain strictly private.
            </p>
          </div>

          {/* Interactive Tool Area */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-sm space-y-4 shadow-xl">
            {/* Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => switchMode("encode")}
                  className={`text-xs h-8 ${
                    mode === "encode"
                      ? "bg-emerald-500 text-black font-semibold hover:bg-emerald-600"
                      : "border-border/60"
                  }`}
                  variant={mode === "encode" ? "default" : "outline"}
                >
                  Encode to Base64
                </Button>
                <Button
                  size="sm"
                  onClick={() => switchMode("decode")}
                  className={`text-xs h-8 ${
                    mode === "decode"
                      ? "bg-emerald-500 text-black font-semibold hover:bg-emerald-600"
                      : "border-border/60"
                  }`}
                  variant={mode === "decode" ? "default" : "outline"}
                >
                  Decode from Base64
                </Button>

                {mode === "encode" && (
                  <label className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground ml-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urlSafe}
                      onChange={(e) => {
                        setUrlSafe(e.target.checked);
                        processText(mode, input, e.target.checked);
                      }}
                      className="rounded border-border/60"
                    />
                    <span>URL-Safe (Base64URL)</span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
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
                  {copied ? "Copied!" : "Copy Result"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/40 px-4 py-2.5 text-xs text-red-300 font-mono">
                Error: {error}
              </div>
            )}

            {/* Inputs & Outputs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground">
                  {mode === "encode" ? "Raw String Input (UTF-8):" : "Base64 Encoded Input:"}
                </label>
                <Textarea
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={mode === "encode" ? "Enter plain text to encode..." : "Paste base64 string to decode..."}
                  className="h-64 font-mono text-xs bg-background/80 border-border/50 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground">
                  {mode === "encode" ? "Base64 Output:" : "Decoded Plain Text (UTF-8):"}
                </label>
                <Textarea
                  value={output}
                  readOnly
                  placeholder="Output appears automatically..."
                  className="h-64 font-mono text-xs bg-background/40 border-border/50 resize-y text-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* DevOS Promotion Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground">All Your Dev Tools in One Workspace</h3>
              <p className="text-xs text-muted-foreground">
                DevOS connects your daily engineering tools, cloud launchers, and profile metrics in one dashboard.
              </p>
            </div>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shrink-0">
                <span>Try DevOS Free</span>
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

