import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Copy, RefreshCw, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/regex-tester")({
  head: () => ({
    meta: [
      { title: "Free Regex Tester & Debugger Online — DevOS" },
      {
        name: "description",
        content:
          "Test regular expressions with real-time match highlighting, flag toggles (g, i, m, s), and error explanations online with DevOS. No signup required.",
      },
      { property: "og:title", content: "Free Regex Tester & Debugger Online — DevOS" },
      {
        property: "og:description",
        content:
          "Test regular expressions with real-time match highlighting, flag toggles (g, i, m, s), and error explanations online with DevOS. No signup required.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/tools/regex-tester" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free Regex Tester & Debugger Online — DevOS" },
      {
        name: "twitter:description",
        content:
          "Test regular expressions with real-time match highlighting, flag toggles (g, i, m, s), and error explanations online with DevOS. No signup required.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/tools/regex-tester",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free Online Regex Tester and Debugger",
          url: "https://www.dev-os.app/tools/regex-tester",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description:
            "Test JavaScript regular expressions with real-time match counts, capture groups, and flag toggles. Free, client-side, with no login required.",
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
              name: "Regex Tester",
              item: "https://www.dev-os.app/tools/regex-tester",
            },
          ],
        }),
      },
    ],
  }),
  component: RegexTesterPage,
});

const PRESETS = [
  { label: "Email Address", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", text: "Reach out to team@dev-os.app or founder@example.com for inquiries." },
  { label: "URL Matcher", pattern: "https?:\\/\\/[\\w\\.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!$&'()*+,;=.]+", text: "Visit https://www.dev-os.app or https://github.com/kashif05shaikh/Dev-OS-Framework" },
  { label: "IPv4 Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", text: "Connecting to 192.168.1.1 and DNS server 8.8.8.8 on port 443." },
  { label: "ISO Date", pattern: "\\d{4}-\\d{2}-\\d{2}", text: "Release date 2026-10-14 recorded in migration audit 2026-12-31." },
];

function RegexTesterPage() {
  const [pattern, setPattern] = useState(PRESETS[0]!.pattern);
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState(PRESETS[0]!.text);
  const [copied, setCopied] = useState(false);

  const evaluation = useMemo(() => {
    if (!pattern) return { error: null, matches: [] };
    try {
      const reg = new RegExp(pattern, flags);
      const matches: { index: number; match: string; groups?: string[] }[] = [];

      if (flags.includes("g")) {
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = reg.exec(testString)) !== null && count < 100) {
          matches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
          count++;
          if (m.index === reg.lastIndex) reg.lastIndex++;
        }
      } else {
        const m = reg.exec(testString);
        if (m) {
          matches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
        }
      }
      return { error: null, matches };
    } catch (err: any) {
      return { error: err.message, matches: [] };
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
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
            <span className="text-emerald-400 font-semibold">Regex Tester</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Zap className="size-3.5" />
              <span>REAL-TIME MATCH EVALUATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Free Regex Tester & Debugger Online
            </h1>
            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed bg-card/60 border border-emerald-500/20 p-5 rounded-xl">
              DevOS Regex Tester is an interactive online regular expression debugger that highlights
              pattern matches in real time as you type. It supports standard JavaScript RegExp syntax,
              customizable regex flags (global, case-insensitive, multiline), and zero-friction client-side
              evaluation without signing in.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-mono">Common Presets:</span>
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  setPattern(p.pattern);
                  setTestString(p.text);
                  setFlags("g");
                }}
                className="text-xs h-7 border-border/60 hover:border-emerald-500/40"
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Interactive Tester Area */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-sm space-y-5 shadow-xl">
            {/* Pattern Input & Flags */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
                <span>Regular Expression Pattern:</span>
                <span className="text-[11px] text-emerald-400 font-normal">Standard JavaScript RegExp</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[240px]">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-mono text-sm">/</span>
                  <Input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter regex pattern, e.g. [a-z0-9]+..."
                    className="pl-7 pr-7 font-mono text-xs bg-background/80 border-border/50 h-10"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground font-mono text-sm">/</span>
                </div>

                {/* Flags Toggles */}
                <div className="flex items-center gap-1 bg-background/60 border border-border/50 rounded-lg p-1">
                  {(["g", "i", "m", "s"] as const).map((flag) => (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => toggleFlag(flag)}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                        flags.includes(flag)
                          ? "bg-emerald-500 text-black font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={`Toggle flag: ${flag}`}
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              </div>

              {evaluation.error && (
                <div className="rounded-lg bg-red-950/40 border border-red-500/40 px-3.5 py-2 text-xs text-red-300 font-mono">
                  Regex Syntax Error: {evaluation.error}
                </div>
              )}
            </div>

            {/* Test String Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-muted-foreground">
                Test Target String:
              </label>
              <Textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter string to test pattern against..."
                className="h-32 font-mono text-xs bg-background/80 border-border/50 resize-y"
              />
            </div>

            {/* Match Results */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-foreground">
                  Matches Found:{" "}
                  <span className="text-emerald-400 font-bold">{evaluation.matches.length}</span>
                </span>
                {evaluation.matches.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const allMatches = evaluation.matches.map((m) => m.match).join("\n");
                      navigator.clipboard.writeText(allMatches);
                      toast.success("Matches copied!");
                    }}
                    className="text-xs h-7 text-emerald-400 hover:text-emerald-300"
                  >
                    Copy All Matches
                  </Button>
                )}
              </div>

              <div className="rounded-lg bg-background/60 border border-border/40 p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                {evaluation.matches.length === 0 ? (
                  <span className="text-muted-foreground">No matches found for current pattern.</span>
                ) : (
                  evaluation.matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 py-1 px-2 rounded bg-card/60 border border-border/30"
                    >
                      <span className="text-emerald-300 truncate">
                        #{idx + 1}: <span className="font-bold">{m.match}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        Index: {m.index}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* DevOS Promotion Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground">Save Regex Snippets in DevOS Notes</h3>
              <p className="text-xs text-muted-foreground">
                DevOS provides markdown technical documentation with full syntax highlighting for regular expressions.
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

