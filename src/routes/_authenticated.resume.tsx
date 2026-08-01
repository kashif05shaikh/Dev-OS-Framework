import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  FileText,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  assertOk,
  describeError,
  requireUserId,
  resumeEntriesQuery,
  resumeSectionsQuery,
  resumesQuery,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  RESUME_SECTION_KINDS,
  RESUME_SECTION_LABEL,
  type Resume,
  type ResumeEntry,
  type ResumeSection,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Builder — DevOS" },
      {
        name: "description",
        content:
          "Build and maintain multiple developer resumes: contact details, summary, experience, education, projects and skills — all saved live.",
      },
      { property: "og:title", content: "Resume Builder — DevOS" },
      {
        property: "og:description",
        content: "Keep several tailored resumes ready, edit sections inline and print to PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResumePage,
});

type EntryDraft = {
  id?: string;
  section_id: string;
  title: string;
  organization: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  bullets: string;
};

function emptyEntry(section_id: string): EntryDraft {
  return {
    section_id,
    title: "",
    organization: "",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
    bullets: "",
  };
}

function toEntryDraft(entry: ResumeEntry): EntryDraft {
  return {
    id: entry.id,
    section_id: entry.section_id,
    title: entry.title,
    organization: entry.organization ?? "",
    location: entry.location ?? "",
    start_date: entry.start_date ?? "",
    end_date: entry.end_date ?? "",
    is_current: entry.is_current,
    description: entry.description ?? "",
    bullets: (entry.bullets ?? []).join("\n"),
  };
}

type SectionDraft = { id?: string; kind: string; title: string };

function ResumePage() {
  const qc = useQueryClient();
  const resumes = useQuery(resumesQuery());

  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft | null>(null);

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
        const defaults = ["experience", "education", "projects", "skills"] as const;
        const { error: sectionError } = await supabase.from("resume_sections").insert(
          defaults.map((kind, index) => ({
            user_id,
            resume_id: resumeId,
            kind,
            title: RESUME_SECTION_LABEL[kind]!,
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

  const makeDefault = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        for (const resume of qc.getQueryData<Resume[]>(["resumes"]) ?? []) {
          if (resume.is_default && resume.id !== id) {
            await updateRow("resumes", resume, { is_default: false });
          }
        }
        await updateRow("resumes", cachedResume(id), { is_default: true });
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Default resume updated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
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

  const saveSection = useMutation({
    mutationFn: async (value: SectionDraft) => {
      if (!activeResumeId) return;
      if (value.id) {
        const cached = (sections.data ?? []).find((s) => s.id === value.id) ?? { id: value.id };
        await updateRow("resume_sections", cached, { kind: value.kind, title: value.title.trim() });
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("resume_sections").insert({
          user_id,
          resume_id: activeResumeId,
          kind: value.kind,
          title: value.title.trim(),
          position: (sections.data ?? []).length,
        });
        assertOk(error);
      });
    },
    onSuccess: () => {
      setSectionDraft(null);
      void qc.invalidateQueries({ queryKey: ["resume_sections"] });
      toast.success("Section saved");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("resume_sections").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resume_sections"] });
      void qc.invalidateQueries({ queryKey: ["resume_entries"] });
      toast.success("Section deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const saveEntry = useMutation({
    mutationFn: async (value: EntryDraft) => {
      const payload = {
        title: value.title.trim(),
        organization: value.organization.trim() || null,
        location: value.location.trim() || null,
        start_date: value.start_date.trim() || null,
        end_date: value.is_current ? null : value.end_date.trim() || null,
        is_current: value.is_current,
        description: value.description.trim() || null,
        bullets: value.bullets
          .split("\n")
          .map((line) => line.replace(/^[-•*]\s*/, "").trim())
          .filter(Boolean),
      };
      if (value.id) {
        const cached = (entries.data ?? []).find((e) => e.id === value.id) ?? { id: value.id };
        await updateRow("resume_entries", cached, payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const position = (entries.data ?? []).filter(
          (e) => e.section_id === value.section_id,
        ).length;
        const { error } = await supabase
          .from("resume_entries")
          .insert({ ...payload, user_id, section_id: value.section_id, position });
        assertOk(error);
      });
    },
    onSuccess: () => {
      setEntryDraft(null);
      void qc.invalidateQueries({ queryKey: ["resume_entries"] });
      toast.success("Entry saved");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("resume_entries").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resume_entries"] });
      toast.success("Entry deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border md:flex">
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
            description="Create a resume to add your contact details, summary, experience and projects."
            action={
              <Button size="sm" onClick={() => createResume.mutate()} disabled={createResume.isPending}>
                <Plus className="size-3.5" />
                New resume
              </Button>
            }
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <div className="mr-auto min-w-0">
                <h1 className="truncate text-sm font-semibold">{active.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {(sections.data ?? []).length} sections · {(entries.data ?? []).length} entries
                  {active.is_default ? " · default" : ""}
                </p>
              </div>
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

            <ScrollArea className="min-h-0 flex-1">
              <div className="mx-auto max-w-3xl space-y-6 p-4 pb-16">
                <ResumeDetails
                  resume={active}
                  onPatch={(patch) => patchResume.mutate({ id: active.id, patch })}
                />

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="mr-auto text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Sections
                    </h2>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setSectionDraft({ kind: "custom", title: "" })}
                    >
                      <Plus className="size-3.5" />
                      Add section
                    </Button>
                  </div>

                  {sections.isLoading ? (
                    <LoadingState label="Loading sections…" />
                  ) : sections.isError ? (
                    <ErrorState error={sections.error} onRetry={() => void sections.refetch()} />
                  ) : (sections.data ?? []).length === 0 ? (
                    <EmptyState
                      icon={<FileText className="size-6" />}
                      title="No sections"
                      description="Add Experience, Education, Projects or a custom section."
                    />
                  ) : (
                    (sections.data ?? []).map((section) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        entries={(entries.data ?? []).filter((e) => e.section_id === section.id)}
                        onEditSection={() =>
                          setSectionDraft({
                            id: section.id,
                            kind: section.kind,
                            title: section.title,
                          })
                        }
                        onDeleteSection={() =>
                          setConfirm({
                            title: "Delete section?",
                            description: `"${section.title}" and its entries will be permanently deleted.`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteSection.mutate(section.id),
                          })
                        }
                        onAddEntry={() => setEntryDraft(emptyEntry(section.id))}
                        onEditEntry={(entry) => setEntryDraft(toEntryDraft(entry))}
                        onDeleteEntry={(entry) =>
                          setConfirm({
                            title: "Delete entry?",
                            description: `"${entry.title || "Untitled entry"}" will be permanently deleted.`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteEntry.mutate(entry.id),
                          })
                        }
                      />
                    ))
                  )}
                </section>
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      <Dialog open={sectionDraft !== null} onOpenChange={(open) => !open && setSectionDraft(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{sectionDraft?.id ? "Edit section" : "Add section"}</DialogTitle>
          </DialogHeader>
          {sectionDraft ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const title =
                  sectionDraft.title.trim() || (RESUME_SECTION_LABEL[sectionDraft.kind] ?? "");
                if (!title) {
                  toast.error("Section title is required");
                  return;
                }
                saveSection.mutate({ ...sectionDraft, title });
              }}
            >
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={sectionDraft.kind}
                  onValueChange={(kind) =>
                    setSectionDraft({
                      ...sectionDraft,
                      kind,
                      title:
                        sectionDraft.title.trim() === "" ||
                        Object.values(RESUME_SECTION_LABEL).includes(sectionDraft.title)
                          ? (RESUME_SECTION_LABEL[kind] ?? "")
                          : sectionDraft.title,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESUME_SECTION_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {RESUME_SECTION_LABEL[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-title">Title</Label>
                <Input
                  id="rs-title"
                  autoFocus
                  value={sectionDraft.title}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, title: e.target.value })}
                  placeholder={RESUME_SECTION_LABEL[sectionDraft.kind]}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSectionDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveSection.isPending}>
                  {saveSection.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={entryDraft !== null} onOpenChange={(open) => !open && setEntryDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{entryDraft?.id ? "Edit entry" : "Add entry"}</DialogTitle>
          </DialogHeader>
          {entryDraft ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!entryDraft.title.trim()) {
                  toast.error("Title is required");
                  return;
                }
                saveEntry.mutate(entryDraft);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="re-title">Title / role</Label>
                  <Input
                    id="re-title"
                    autoFocus
                    value={entryDraft.title}
                    onChange={(e) => setEntryDraft({ ...entryDraft, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="re-org">Organisation</Label>
                  <Input
                    id="re-org"
                    value={entryDraft.organization}
                    onChange={(e) => setEntryDraft({ ...entryDraft, organization: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="re-loc">Location</Label>
                  <Input
                    id="re-loc"
                    value={entryDraft.location}
                    onChange={(e) => setEntryDraft({ ...entryDraft, location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="re-start">Start</Label>
                  <Input
                    id="re-start"
                    value={entryDraft.start_date}
                    onChange={(e) => setEntryDraft({ ...entryDraft, start_date: e.target.value })}
                    placeholder="Jan 2024"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="re-end">End</Label>
                  <Input
                    id="re-end"
                    value={entryDraft.is_current ? "" : entryDraft.end_date}
                    disabled={entryDraft.is_current}
                    onChange={(e) => setEntryDraft({ ...entryDraft, end_date: e.target.value })}
                    placeholder="Mar 2025"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={entryDraft.is_current}
                  onCheckedChange={(checked) =>
                    setEntryDraft({ ...entryDraft, is_current: checked === true })
                  }
                />
                Currently here
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="re-desc">Description</Label>
                <Textarea
                  id="re-desc"
                  rows={2}
                  value={entryDraft.description}
                  onChange={(e) => setEntryDraft({ ...entryDraft, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="re-bullets">Bullet points (one per line)</Label>
                <Textarea
                  id="re-bullets"
                  rows={4}
                  value={entryDraft.bullets}
                  onChange={(e) => setEntryDraft({ ...entryDraft, bullets: e.target.value })}
                  placeholder={"Shipped X, cutting latency 40%\nLed a team of 3"}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEntryDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveEntry.isPending}>
                  {saveEntry.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}

const DETAIL_FIELDS = [
  { key: "title", label: "Resume title", placeholder: "Backend engineer resume" },
  { key: "full_name", label: "Full name", placeholder: "Ada Lovelace" },
  { key: "headline", label: "Headline", placeholder: "Full-stack developer" },
  { key: "email", label: "Email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone", placeholder: "+91 …" },
  { key: "location", label: "Location", placeholder: "Bengaluru, IN" },
  { key: "website_url", label: "Website", placeholder: "https://…" },
  { key: "github_url", label: "GitHub", placeholder: "https://github.com/…" },
  { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
] as const;

function ResumeDetails({
  resume,
  onPatch,
}: {
  resume: Resume;
  onPatch: (patch: Partial<Resume>) => void;
}) {
  const [form, setForm] = useState(() => detailState(resume));
  const [status, setStatus] = useState<"idle" | "dirty" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeId = resume.id;

  useEffect(() => {
    setForm(detailState(resume));
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const update = (key: string, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const patch: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(next)) {
        patch[k] = k === "title" ? v.trim() || "Untitled resume" : v.trim() || null;
      }
      onPatch(patch as Partial<Resume>);
      setStatus("saved");
    }, 700);
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Details
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {status === "dirty" ? "Saving…" : status === "saved" ? (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3" /> Saved
            </span>
          ) : null}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DETAIL_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`rd-${field.key}`} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={`rd-${field.key}`}
              value={form[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => update(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rd-summary" className="text-xs">
          Professional summary
        </Label>
        <Textarea
          id="rd-summary"
          rows={3}
          value={form['summary'] ?? ""}
          placeholder="Two or three lines about what you build and what you're looking for."
          onChange={(e) => update("summary", e.target.value)}
        />
      </div>
    </section>
  );
}

function detailState(resume: Resume): Record<string, string> {
  return {
    title: resume.title ?? "",
    full_name: resume.full_name ?? "",
    headline: resume.headline ?? "",
    email: resume.email ?? "",
    phone: resume.phone ?? "",
    location: resume.location ?? "",
    website_url: resume.website_url ?? "",
    github_url: resume.github_url ?? "",
    linkedin_url: resume.linkedin_url ?? "",
    summary: resume.summary ?? "",
  };
}

function SectionCard({
  section,
  entries,
  onEditSection,
  onDeleteSection,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: {
  section: ResumeSection;
  entries: ResumeEntry[];
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddEntry: () => void;
  onEditEntry: (entry: ResumeEntry) => void;
  onDeleteEntry: (entry: ResumeEntry) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <GripVertical className="size-3.5 text-muted-foreground/50" />
        <h3 className="mr-auto text-sm font-medium">{section.title}</h3>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onAddEntry}>
          <Plus className="size-3.5" />
          Add entry
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditSection}>
              <Pencil className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDeleteSection}
            >
              <Trash2 className="size-3.5" />
              Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No entries yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border/60 px-3 py-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.title || "Untitled"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      entry.organization,
                      entry.location,
                      [entry.start_date, entry.is_current ? "Present" : entry.end_date]
                        .filter(Boolean)
                        .join(" – "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label="Edit entry"
                  onClick={() => onEditEntry(entry)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive hover:text-destructive"
                  aria-label="Delete entry"
                  onClick={() => onDeleteEntry(entry)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {entry.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>
              ) : null}
              {(entry.bullets ?? []).length > 0 ? (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {(entry.bullets ?? []).map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
