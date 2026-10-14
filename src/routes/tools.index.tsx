import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { ArrowRight, Binary, Code2, Fingerprint, FileJson, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "Free Online Developer Tools & Utilities — DevOS" },
      {
        name: "description",
        content:
          "Free, private, client-side developer tools: JSON formatter & validator, regex debugger, Base64 encoder/decoder, and UUID v4 generator.",
      },
      { property: "og:title", content: "Free Online Developer Tools & Utilities — DevOS" },
      {
        property: "og:description",
        content:
          "Free, private, client-side developer tools: JSON formatter & validator, regex debugger, Base64 encoder/decoder, and UUID v4 generator.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/tools" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free Online Developer Tools & Utilities — DevOS" },
      {
        name: "twitter:description",
        content:
          "Free, private, client-side developer tools: JSON formatter & validator, regex debugger, Base64 encoder/decoder, and UUID v4 generator.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/tools",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Free Online Developer Utilities Directory",
          url: "https://www.dev-os.app/tools",
          description:
            "A collection of 100% private, client-side utilities including JSON formatter, Regex debugger, Base64 converter, and UUID generator.",
          publisher: {
            "@type": "Organization",
            name: "DevOS",
            url: "https://www.dev-os.app/",
          },
        }),
      },
    ],
  }),
  component: ToolsIndexPage,
});

const TOOLS_LIST = [
  {
    title: "Free JSON Formatter & Validator",
    slug: "json-formatter",
    href: "/tools/json-formatter" as const,
    desc: "Beautify, validate, format, and minify JSON data instantly with client-side syntax error detection.",
    icon: FileJson,
    badge: "JSON & Data",
  },
  {
    title: "Regex Tester & Match Debugger",
    slug: "regex-tester",
    href: "/tools/regex-tester" as const,
    desc: "Test regular expressions with real-time match highlighting, flags (g, i, m, s), and common presets.",
    icon: Code2,
    badge: "RegExp",
  },
  {
    title: "Base64 Encoder & Decoder",
    slug: "base64",
    href: "/tools/base64" as const,
    desc: "Convert UTF-8 text to standard Base64 and URL-safe Base64URL formats privately in your browser.",
    icon: Binary,
    badge: "Encoding",
  },
  {
    title: "UUID v4 Generator Online",
    slug: "uuid-generator",
    href: "/tools/uuid-generator" as const,
    desc: "Generate cryptographically secure RFC 4122 version 4 UUIDs and GUIDs in batches with casing controls.",
    icon: Fingerprint,
    badge: "Crypto & IDs",
  },
];

function ToolsIndexPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>FREE • CLIENT-SIDE • NO SIGNUP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Essential Developer Utilities
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Fast, privacy-first web utilities that run 100% inside your browser. No server uploads, no
              trackers, and no signup needed.
            </p>
          </div>

          {/* Grid of Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS_LIST.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  to={tool.href}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-card/90 hover:shadow-xl hover:shadow-emerald-950/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{tool.badge}</span>
                    </div>

                    <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-emerald-400">
                    <span>Open Tool Online</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

