import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Rocket, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { AiLogo } from "@/components/ai-logo";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AI_PLATFORMS, type AiPlatform } from "@/lib/ai-models";
import { formatLastUsed, useAiWorkspace } from "@/lib/ai-usage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI Workspace — DevOS" },
      {
        name: "description",
        content:
          "One-click launcher for ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot, Lovable, Replit, Bolt and Emergent.",
      },
      { property: "og:title", content: "AI Workspace — DevOS" },
      {
        property: "og:description",
        content: "Every AI tool you use, pinned and one click away inside DevOS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiWorkspacePage,
});

function AiWorkspacePage() {
  const { state, toggleFavorite, recordUse } = useAiWorkspace();
  const [search, setSearch] = useState("");

  // The anchor's target="_blank" handles the real navigation. Inside an
  // embedded preview frame the host can swallow that request, so we surface a
  // copy-link escape hatch instead of leaving the user on a blocked page.
  const launch = (_event: React.MouseEvent<HTMLAnchorElement>, p: AiPlatform) => {
    recordUse(p.id);
    if (typeof window !== "undefined" && window.top !== window.self) {
      toast(`Opening ${p.label}`, {
        description: "If your browser blocks it, copy the link and paste it in a new tab.",
        action: {
          label: "Copy link",
          onClick: () => {
            void navigator.clipboard.writeText(p.url);
            toast.success("Link copied");
          },
        },
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = AI_PLATFORMS.filter(
      (p) =>
        !q ||
        p.label.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
    return [...list].sort((a, b) => {
      const fa = state.favorites.includes(a.id) ? 0 : 1;
      const fb = state.favorites.includes(b.id) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (state.usage[b.id]?.count ?? 0) - (state.usage[a.id]?.count ?? 0);
    });
  }, [search, state]);

  const recent = useMemo(
    () =>
      AI_PLATFORMS.filter((p) => state.usage[p.id]?.lastUsedAt)
        .sort(
          (a, b) =>
            new Date(state.usage[b.id]!.lastUsedAt).getTime() -
            new Date(state.usage[a.id]!.lastUsedAt).getTime(),
        )
        .slice(0, 6),
    [state],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold tracking-tight">AI Workspace</h1>
          <p className="text-xs text-muted-foreground">
            {AI_PLATFORMS.length} platforms · one click away
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI platforms…"
            className="w-60 pl-9"
          />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6">
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quick launch
            </h2>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/50 p-3 backdrop-blur-xl">
                {AI_PLATFORMS.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   onClick={(event) => launch(event, p)}
                  title={`Open ${p.label}`}
                  className="group flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10"
                >
                  <AiLogo platform={p} className="size-4 transition-transform group-hover:scale-110" />
                  {p.label}
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              All platforms
            </h2>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Rocket className="size-6" />}
                title="No platform matches your search"
                description="Try a shorter term — for example “deep” for DeepSeek."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => {
                  const usage = state.usage[p.id];
                  const fav = state.favorites.includes(p.id);
                  return (
                    <article
                      key={p.id}
                      className="group flex flex-col rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background/70">
                          <AiLogo platform={p} className="size-6" />
                        </span>
                        <div className="mr-auto min-w-0">
                          <h3 className="truncate text-sm font-medium">{p.label}</h3>
                          <p className="text-[11px] text-muted-foreground">{p.vendor}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={fav ? `Unpin ${p.label}` : `Pin ${p.label}`}
                          onClick={() => toggleFavorite(p.id)}
                          className="text-muted-foreground transition-colors hover:text-amber-400"
                        >
                          <Star className={cn("size-4", fav && "fill-current text-amber-400")} />
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{p.description}</p>
                      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                        <div className="mr-auto text-[11px] text-muted-foreground">
                          <div>{formatLastUsed(usage?.lastUsedAt)}</div>
                          <div>Opened {usage?.count ?? 0}×</div>
                        </div>
                         <Button size="sm" asChild>
                           <a
                             href={p.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={(event) => launch(event, p)}
                           >
                            <Rocket className="size-4" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {recent.length > 0 ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="size-3.5" />
                Recent activity
              </h2>
              <ul className="divide-y divide-border rounded-2xl border border-border/70 bg-card/50 backdrop-blur-xl">
                {recent.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <AiLogo platform={p} className="size-4" />
                    <span className="mr-auto">{p.label}</span>
                    <span className="text-muted-foreground">
                      {formatLastUsed(state.usage[p.id]?.lastUsedAt)}
                    </span>
                     <Button variant="ghost" size="sm" asChild>
                       <a
                         href={p.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         onClick={(event) => launch(event, p)}
                       >
                        Open
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
