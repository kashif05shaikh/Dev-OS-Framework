import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Copy,
  Files,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { craftPrompt } from "@/lib/ai-prompts.functions";
import { AiLogo } from "@/components/ai-logo";
import { AI_PLATFORMS, findAiPlatform, type AiPlatform } from "@/lib/ai-models";
import { useAiWorkspace } from "@/lib/ai-usage";
import {
  aiPromptsQuery,
  assertOk,
  describeError,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  PROMPT_CATEGORIES,
  PROMPT_CATEGORY_LABEL,
  type AiPrompt,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({
    meta: [
      { title: "AI Prompts — DevOS" },
      {
        name: "description",
        content:
          "A reusable AI prompt library: save, tag, favourite and improve your best prompts with AI.",
      },
      { property: "og:title", content: "AI Prompts — DevOS" },
      {
        property: "og:description",
        content: "Save, organise and refine the AI prompts you reuse every day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromptsPage,
});

type PromptDraft = {
  id?: string;
  title: string;
  body: string;
  category: string;
  model: string;
  tags: string;
};

function emptyDraft(): PromptDraft {
  return { title: "", body: "", category: "general", model: "", tags: "" };
}

function toDraft(p: AiPrompt): PromptDraft {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    category: p.category,
    model: p.model ?? "",
    tags: p.tags.join(", "),
  };
}

function PromptsPage() {
  const qc = useQueryClient();
  const prompts = useQuery(aiPromptsQuery());
  const craft = useServerFn(craftPrompt);
  const { recordUse } = useAiWorkspace();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [draft, setDraft] = useState<PromptDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const findCachedRow = (id: string): { id: string } =>
    (qc.getQueryData<AiPrompt[]>(["ai_prompts"]) ?? []).find((r) => r.id === id) ?? { id };

  const savePrompt = useMutation({
    mutationFn: async (value: PromptDraft) => {
      const payload = {
        title: value.title.trim(),
        body: value.body.trim(),
        category: value.category,
        model: value.model.trim() || null,
        tags: value.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (value.id) {
        await updateRow("ai_prompts", findCachedRow(value.id), payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("ai_prompts").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["ai_prompts"] });
      toast.success(value.id ? "Prompt updated" : "Prompt saved");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchPrompt = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AiPrompt> }) =>
      updateRow("ai_prompts", findCachedRow(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["ai_prompts"] });
      const previous = qc.getQueryData<AiPrompt[]>(["ai_prompts"]);
      qc.setQueryData<AiPrompt[]>(["ai_prompts"], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["ai_prompts"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["ai_prompts"] }),
  });

  const deletePrompt = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ai_prompts"] });
      toast.success("Prompt deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const duplicatePrompt = useMutation({
    mutationFn: async (p: AiPrompt) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("ai_prompts").insert({
          user_id,
          title: `${p.title} (copy)`,
          body: p.body,
          category: p.category,
          model: p.model,
          tags: p.tags,
        });
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ai_prompts"] });
      toast.success("Prompt duplicated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const aiCraft = useMutation({
    mutationFn: async (input: { mode: "improve" | "generate"; text: string; category: string }) =>
      craft({ data: input }),
    onSuccess: (result) => {
      setDraft((prev) => (prev ? { ...prev, body: result.text } : prev));
      toast.success("Prompt updated by AI");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const copyPrompt = async (prompt: AiPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      toast.success("Copied to clipboard");
      patchPrompt.mutate({
        id: prompt.id,
        patch: { usage_count: prompt.usage_count + 1, last_used_at: new Date().toISOString() },
      });
    } catch {
      toast.error("Your browser blocked clipboard access.");
    }
  };

  const openIn = (prompt: AiPrompt, target: AiPlatform) => {
    // Fire-and-forget: awaiting here would drop the user gesture and the
    // browser would block the new tab.
    navigator.clipboard
      ?.writeText(prompt.body)
      .then(() => toast.success(`Prompt copied! Paste it into ${target.label}.`))
      .catch(() => toast.message(`Opening ${target.label} — copy your prompt manually.`));
    patchPrompt.mutate({
      id: prompt.id,
      patch: { usage_count: prompt.usage_count + 1, last_used_at: new Date().toISOString() },
    });
    recordUse(target.id);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (prompts.data ?? []).filter((p) => {
      if (favouritesOnly && !p.favorite) return false;
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [prompts.data, search, category, favouritesOnly]);

  if (prompts.isLoading) return <LoadingState label="Loading your prompt library…" />;
  if (prompts.error)
    return <ErrorState error={prompts.error} onRetry={() => void prompts.refetch()} />;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold tracking-tight">AI Prompts</h1>
          <p className="text-xs text-muted-foreground">
            {prompts.data?.length ?? 0} saved prompt{(prompts.data?.length ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="w-56 pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PROMPT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {PROMPT_CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={favouritesOnly ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFavouritesOnly((v) => !v)}
        >
          <Star className={cn("size-4", favouritesOnly && "fill-current text-amber-400")} />
          Favourites
        </Button>
        <Button size="sm" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" />
          New prompt
        </Button>
      </header>


      <ScrollArea className="flex-1">
        <div className="p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title={prompts.data?.length ? "No prompts match your filters" : "No prompts yet"}
              description="Save the prompts you reuse — then improve them with AI in one click."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-4" />
                  New prompt
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-2">
                    <h2 className="mr-auto text-sm font-medium leading-tight">{p.title}</h2>
                    <button
                      type="button"
                      aria-label={p.favorite ? "Remove from favourites" : "Add to favourites"}
                      onClick={() =>
                        patchPrompt.mutate({ id: p.id, patch: { favorite: !p.favorite } })
                      }
                      className="text-muted-foreground transition-colors hover:text-amber-400"
                    >
                      <Star className={cn("size-4", p.favorite && "fill-current text-amber-400")} />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-primary">
                      {PROMPT_CATEGORY_LABEL[p.category] ?? p.category}
                    </span>
                    {p.model ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                        {findAiPlatform(p.model) ? (
                          <AiLogo platform={findAiPlatform(p.model)!} className="size-3" />
                        ) : null}
                        {findAiPlatform(p.model)?.label ?? p.model}
                      </span>
                    ) : null}
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-xs text-muted-foreground">
                    {p.body}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Open in
                    </span>
                    {AI_PLATFORMS.map((target) => (
                      <a
                        key={target.id}
                        href={target.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open in ${target.label}`}
                        aria-label={`Open in ${target.label}`}
                        onClick={() => openIn(p, target)}
                        className="rounded-lg border border-border/60 bg-background/60 p-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
                      >
                        <AiLogo platform={target} className="size-4" />
                      </a>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                    <span className="mr-auto text-[11px] text-muted-foreground">
                      Used {p.usage_count}×
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => void copyPrompt(p)}>
                      <Copy className="size-4" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Duplicate prompt"
                      onClick={() => duplicatePrompt.mutate(p)}
                    >
                      <Files className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDraft(toDraft(p))}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirm({
                          title: "Delete prompt?",
                          description: `"${p.title}" will be permanently removed.`,
                          confirmLabel: "Delete",
                          onConfirm: () => deletePrompt.mutate(p.id),
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft?.title.trim() || !draft.body.trim()) return;
              savePrompt.mutate(draft);
            }}
          >
            <DialogHeader>
              <DialogTitle>{draft?.id ? "Edit prompt" : "New prompt"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="prompt-title">Title</Label>
                  <Input
                    id="prompt-title"
                    autoFocus
                    value={draft?.title ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, title: e.target.value } : d))
                    }
                    placeholder="Code review assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={draft?.category ?? "general"}
                    onValueChange={(v) => setDraft((d) => (d ? { ...d, category: v } : d))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMPT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {PROMPT_CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt-body">Prompt</Label>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={aiCraft.isPending || !draft?.body.trim()}
                      onClick={() =>
                        draft &&
                        aiCraft.mutate({
                          mode: "generate",
                          text: draft.body,
                          category: draft.category,
                        })
                      }
                    >
                      {aiCraft.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Generate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={aiCraft.isPending || !draft?.body.trim()}
                      onClick={() =>
                        draft &&
                        aiCraft.mutate({
                          mode: "improve",
                          text: draft.body,
                          category: draft.category,
                        })
                      }
                    >
                      {aiCraft.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                      Improve
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="prompt-body"
                  rows={12}
                  value={draft?.body ?? ""}
                  onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
                  placeholder="You are a senior engineer reviewing…"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prompt-model">Preferred model (optional)</Label>
                  <Select
                    value={draft?.model ? draft.model : "none"}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, model: v === "none" ? "" : v } : d))
                    }
                  >
                    <SelectTrigger id="prompt-model">
                      <SelectValue placeholder="No preferred model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preferred model</SelectItem>
                      {AI_PLATFORMS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            <AiLogo platform={m} className="size-4" />
                            {m.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-tags">Tags (comma separated)</Label>
                  <Input
                    id="prompt-tags"
                    value={draft?.tags ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, tags: e.target.value } : d))}
                    placeholder="react, refactor"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savePrompt.isPending || !draft?.title.trim() || !draft?.body.trim()}
              >
                {savePrompt.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {draft?.id ? "Save changes" : "Save prompt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
