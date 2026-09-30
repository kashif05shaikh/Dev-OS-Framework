import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Copy, ExternalLink, Info, Rocket, Search, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AiLogo } from "@/components/ai-logo";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AI_PLATFORMS, type AiPlatform } from "@/lib/ai-models";
import { formatLastUsed, useAiWorkspace } from "@/lib/ai-usage";
import { copyText, isEmbedded, standaloneAppUrl } from "@/lib/open-external";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI Workspace — DevOS" },
      {
        name: "description",
        content:
          "One-click launcher for ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Copilot, Replit, Bolt and Emergent.",
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

  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setEmbedded(isEmbedded()), []);

  const launch = (_event: React.MouseEvent<HTMLAnchorElement>, p: AiPlatform) => {
    recordUse(p.id);
  };

  const copyLink = async (p: AiPlatform) => {
    const ok = await copyText(p.url);
    if (ok) toast.success(`${p.label} link copied`, { description: p.url });
    else toast.error("Could not copy the link", { description: p.url });
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
    <div className="flex h-full flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Workspace</h1>
            <p className="text-xs text-muted-foreground">
              {AI_PLATFORMS.length} platforms · one click away
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI platforms…"
            className="w-full pl-9 pr-4"
          />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6 lg:p-8">
          {embedded ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <Info className="size-5 shrink-0 text-amber-400" />
              <p className="mr-auto max-w-2xl text-xs leading-relaxed text-amber-100/90">
                External AI websites cannot be opened inside an embedded preview because those
                websites block embedding. Open the published app or use the “Open in New Tab” action
                below.
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href={standaloneAppUrl("/ai")} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open Published App
                </a>
              </Button>
            </div>
          ) : null}

          {/* Quick Launch */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Launch
            </h2>
            <div className="flex flex-wrap gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur">
              {AI_PLATFORMS.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => launch(event, p)}
                  title={`Open ${p.label}`}
                  className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-md"
                >
                  <AiLogo
                    platform={p}
                    className="size-4 transition-transform group-hover:scale-110"
                  />
                  <span>{p.label}</span>
                </a>
              ))}
            </div>
          </section>

          {/* All Platforms */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                All Platforms ({filtered.length})
              </h2>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Rocket className="size-6" />}
                title="No platform matches your search"
                description="Try a shorter term — for example “deep” for DeepSeek."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => {
                  const usage = state.usage[p.id];
                  const fav = state.favorites.includes(p.id);
                  return (
                    <article
                      key={p.id}
                      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-xl border border-border/60 bg-background/80 p-2 shadow-inner">
                              <AiLogo platform={p} className="size-6" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                                {p.label}
                              </h3>
                              <Badge
                                variant="outline"
                                className="mt-0.5 px-2 py-0 text-[10px] text-muted-foreground font-normal"
                              >
                                {p.vendor}
                              </Badge>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={fav ? `Unpin ${p.label}` : `Pin ${p.label}`}
                            onClick={() => toggleFavorite(p.id)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-amber-400"
                          >
                            <Star
                              className={cn("size-4", fav && "fill-amber-400 text-amber-400")}
                            />
                          </button>
                        </div>

                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground min-h-[2.5rem]">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-6 border-t border-border/70 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] leading-tight text-muted-foreground">
                            <span className="block font-medium text-foreground/80">
                              {formatLastUsed(usage?.lastUsedAt)}
                            </span>
                            <span className="text-[10px] opacity-75">
                              Opened {usage?.count ?? 0}×
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg"
                              aria-label={`Copy ${p.label} link`}
                              title="Copy link"
                              onClick={() => void copyLink(p)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg"
                              aria-label={fav ? `Unfavorite ${p.label}` : `Favorite ${p.label}`}
                              title="Favorite"
                              onClick={() => toggleFavorite(p.id)}
                            >
                              <Star
                                className={cn("size-3.5", fav && "fill-amber-400 text-amber-400")}
                              />
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                              asChild
                            >
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => launch(event, p)}
                              >
                                <Rocket className="size-3.5" />
                                <span>Open</span>
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          {recent.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3.5" />
                Recent Activity
              </h2>
              <ul className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card p-2">
                {recent.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors hover:bg-accent/40 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <AiLogo platform={p} className="size-4" />
                      <span className="font-medium text-foreground">{p.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-[11px]">
                        {formatLastUsed(state.usage[p.id]?.lastUsedAt)}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs" asChild>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => launch(event, p)}
                        >
                          Open
                        </a>
                      </Button>
                    </div>
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
