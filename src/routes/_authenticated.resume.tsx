import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import {
  DOC_SECTIONS,
  ResumeDocument,
  type DocKind,
  type EntryPatch,
} from "@/components/resume-doc";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  codingProfilesQuery,
  describeError,
  requireUserId,
  resumeEntriesQuery,
  resumeSectionsQuery,
  resumesQuery,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import type { Resume, ResumeEntry } from "@/lib/devos-types";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Builder — DevOS" },
      {
        name: "description",
        content:
          "Write your developer resume as one live document: education, projects, technical skills and achievements, edited inline and printed to PDF.",
      },
      { property: "og:title", content: "Resume Builder — DevOS" },
      {
        property: "og:description",
        content: "A single-column LaTeX-style resume you edit inline and print to PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const qc = useQueryClient();
  const resumes = useQuery(resumesQuery());
  const coding = useQuery(codingProfilesQuery());

  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const list = resumes.data ?? [];
  const active = useMemo(
    () => list.find((r) => r.id === activeId) ?? list[0] ?? null,
    [list, activeId],
  );
  const activeResumeId = active?.id ?? null;

  const sections = useQuery(resumeSectionsQuery(activeResumeId));
  const sectionIds = useMemo(() => (sections.data ?? []).map((s) => s.id), [sections.data]);
  const entries = useQuery(resumeEntriesQuery(sectionIds));

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["resumes"] });
    void qc.invalidateQueries({ queryKey: ["resume_sections"] });
    void qc.invalidateQueries({ queryKey: ["resume_entries"] });
  };

  const cachedResume = (id: string): { id: string } =>
    (qc.getQueryData<Resume[]>(["resumes"]) ?? []).find((r) => r.id === id) ?? { id };

  const createResume = useMutation({
    mutationFn: async () =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const isFirst = (qc.getQueryData<Resume[]>(["resumes"]) ?? []).length === 0;
        const { data, error } = await supabase
          .from("resumes")
          .insert({ user_id, title: "Untitled resume", is_default: isFirst })
          .select("id")
          .single();
        assertOk(error);
        const resumeId = data!.id;
        const { error: sectionError } = await supabase.from("resume_sections").insert(
          DOC_SECTIONS.map((s, index) => ({
            user_id,
            resume_id: resumeId,
            kind: s.kind,
            title: s.title,
            position: index,
          })),
        );
        assertOk(sectionError);
        return resumeId;
      }),
    onSuccess: (id) => {
      setActiveId(id);
      invalidateAll();
      toast.success("Resume created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchResume = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Resume> }) =>
      updateRow("resumes", cachedResume(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["resumes"] });
      const previous = qc.getQueryData<Resume[]>(["resumes"]);
      qc.setQueryData<Resume[]>(["resumes"], (old) =>
        (old ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["resumes"], ctx.previous);
      toast.error(describeError(e));
    },
  });

  const deleteResume = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("resumes").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      setActiveId(null);
      invalidateAll();
      toast.success("Resume deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const toggleSection = useMutation({
    mutationFn: async ({
      kind,
      title,
      enabled,
    }: {
      kind: DocKind;
      title: string;
      enabled: boolean;
    }) =>
      runWithRetry(async () => {
        if (!activeResumeId) return;
        const existing = (sections.data ?? []).find((s) => s.kind === kind);
        if (!enabled) {
          if (!existing) return;
          const { error } = await supabase.from("resume_sections").delete().eq("id", existing.id);
          assertOk(error);
          return;
        }
        if (existing) return;
        const user_id = await requireUserId();
        const position = DOC_SECTIONS.findIndex((s) => s.kind === kind);
        const { error } = await supabase
          .from("resume_sections")
          .insert({ user_id, resume_id: activeResumeId, kind, title, position });
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resume_sections"] });
      void qc.invalidateQueries({ queryKey: ["resume_entries"] });
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const addEntry = useMutation({
    mutationFn: async ({ sectionId }: { sectionId: string; kind: string }) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const position = (entries.data ?? []).filter((e) => e.section_id === sectionId).length;
        const { error } = await supabase.from("resume_entries").insert({
          user_id,
          section_id: sectionId,
          title: "",
          bullets: [],
          position,
        });
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["resume_entries"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchEntry = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: EntryPatch }) => {
      const cached = (entries.data ?? []).find((e) => e.id === id) ?? { id };
      await updateRow("resume_entries", cached, patch as Record<string, unknown>);
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["resume_entries"] });
      const key = ["resume_entries", [...sectionIds].sort().join(",")];
      const previous = qc.getQueryData<ResumeEntry[]>(key);
      qc.setQueryData<ResumeEntry[]>(key, (old) =>
        (old ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
      return { previous, key };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["resume_entries"] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("resume_entries").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["resume_entries"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  return (
    <div className="flex h-full min-h-0">
      <aside className="no-print hidden w-56 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <p className="mr-auto text-xs font-medium">Resumes</p>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="New resume"
            disabled={createResume.isPending}
            onClick={() => createResume.mutate()}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {resumes.isLoading ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Loading…</p>
            ) : list.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">No resumes yet.</p>
            ) : (
              list.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => setActiveId(resume.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                    resume.id === activeResumeId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <FileText className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{resume.title}</span>
                  {resume.is_default ? (
                    <Star className="size-3 shrink-0 fill-primary text-primary" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {resumes.isLoading ? (
          <LoadingState label="Loading resumes…" />
        ) : resumes.isError ? (
          <ErrorState error={resumes.error} onRetry={() => void resumes.refetch()} />
        ) : !active ? (
          <EmptyState
            icon={<FileText className="size-6" />}
            title="No resume yet"
            description="Create a resume to start writing your education, projects, skills and achievements."
            action={
              <Button
                size="sm"
                onClick={() => createResume.mutate()}
                disabled={createResume.isPending}
              >
                <Plus className="size-3.5" />
                New resume
              </Button>
            }
          />
        ) : (
          <>
            <header className="no-print flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <Input
                className="mr-auto h-8 w-52 text-sm"
                aria-label="Resume title"
                defaultValue={active.title}
                key={active.id}
                onBlur={(e) => {
                  const title = e.target.value.trim() || "Untitled resume";
                  if (title !== active.title) {
                    patchResume.mutate({ id: active.id, patch: { title } });
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => makeDefault.mutate(active.id)}
                disabled={active.is_default || makeDefault.isPending}
              >
                <Star className="size-3.5" />
                {active.is_default ? "Default" : "Set default"}
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => window.print()}>
                <Printer className="size-3.5" />
                Print / PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() =>
                  setConfirm({
                    title: "Delete resume?",
                    description: `"${active.title}" and all of its sections and entries will be permanently deleted.`,
                    confirmLabel: "Delete",
                    onConfirm: () => deleteResume.mutate(active.id),
                  })
                }
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </header>

            <ScrollArea className="resume-print-root min-h-0 flex-1">
              <div className="p-4 pb-16">
                {sections.isError ? (
                  <ErrorState error={sections.error} onRetry={() => void sections.refetch()} />
                ) : (
                  <ResumeDocument
                    resume={active}
                    sections={sections.data ?? []}
                    entries={entries.data ?? []}
                    codingProfiles={coding.data ?? []}
                    onPatchResume={(patch) => patchResume.mutate({ id: active.id, patch })}
                    onPatchEntry={(id, patch) => patchEntry.mutate({ id, patch })}
                    onAddEntry={(sectionId, kind) => addEntry.mutate({ sectionId, kind })}
                    onDeleteEntry={(entry) =>
                      setConfirm({
                        title: "Delete entry?",
                        description: `"${entry.title || "Untitled entry"}" will be permanently deleted.`,
                        confirmLabel: "Delete",
                        onConfirm: () => deleteEntry.mutate(entry.id),
                      })
                    }
                    onToggleSection={(kind, title, enabled) =>
                      toggleSection.mutate({ kind, title, enabled })
                    }
                  />
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
