import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wrench,
  FileJson,
  Code2,
  Binary,
  Fingerprint,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { DevServices } from "@/components/dev-services";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dev-tools")({
  head: () => ({
    meta: [
      { title: "Dev Tools — DevOS" },
      {
        name: "description",
        content:
          "Quick launch your developer stack: GitHub, Vercel, Netlify, Railway, Render, Supabase, Cloudinary, Docker Hub, MongoDB Atlas, Firebase, plus VS Code, Cursor, Antigravity, and built-in offline utilities.",
      },
      { property: "og:title", content: "Dev Tools — DevOS" },
      {
        property: "og:description",
        content: "One-click access to every dashboard, editor and utility you use while building.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DevToolsPage,
});

const BUILTIN_UTILITIES = [
  {
    title: "JSON Formatter & Validator",
    to: "/tools/json-formatter",
    desc: "Beautify, validate, format, and minify JSON data with instant syntax error detection.",
    icon: FileJson,
    badge: "JSON & Data",
  },
  {
    title: "Regex Tester & Debugger",
    to: "/tools/regex-tester",
    desc: "Test regular expressions with real-time match highlighting, regex flags, and common presets.",
    icon: Code2,
    badge: "RegExp",
  },
  {
    title: "Base64 Encoder & Decoder",
    to: "/tools/base64",
    desc: "Convert UTF-8 text to standard Base64 and URL-safe Base64URL formats privately in browser.",
    icon: Binary,
    badge: "Encoding",
  },
  {
    title: "UUID v4 Generator Online",
    to: "/tools/uuid-generator",
    desc: "Generate cryptographically secure RFC 4122 version 4 UUIDs in bulk with casing controls.",
    icon: Fingerprint,
    badge: "Crypto & IDs",
  },
] as const;

function DevToolsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Dev Tools</h1>
          <p className="text-xs text-muted-foreground">
            Quick launch every dashboard, editor, and developer utility you work with
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-8 p-4 sm:p-6">
          {/* Built-in Utilities Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                <Sparkles className="size-3.5" />
              </span>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Built-in Web Utilities
                </h2>
                <p className="text-xs text-muted-foreground/80">
                  Client-side, privacy-first developer tools with zero server uploads
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {BUILTIN_UTILITIES.map((tool) => (
                <Link
                  key={tool.title}
                  to={tool.to}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-card hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                        <tool.icon className="size-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium border-border">
                        {tool.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {tool.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-400/90 group-hover:text-emerald-400">
                    <span>Open tool</span>
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Cloud Services & IDE Stack Launchers */}
          <section className="space-y-3">
            <DevServices />
          </section>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Wrench className="size-3" />
            Cloud links open in a new tab — sign in with your own accounts.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
