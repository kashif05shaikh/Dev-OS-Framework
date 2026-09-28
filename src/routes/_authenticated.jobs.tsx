import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Briefcase,
  CalendarClock,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
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
  jobApplicationsQuery,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  type JobApplication,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "Job Tracker — DevOS" },
      {
        name: "description",
        content:
          "Track every job application through wishlist, applied, interview, offer and rejection with follow-up dates and contacts.",
      },
      { property: "og:title", content: "Job Tracker — DevOS" },
      {
        property: "og:description",
        content: "A pipeline board for your job applications, follow-ups and contacts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobsPage,
});

const STATUS_CLASS: Record<string, string> = {
  wishlist: "bg-muted text-muted-foreground",
  applied: "bg-primary/15 text-primary",
  interview: "bg-amber-500/15 text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  ghosted: "bg-muted text-muted-foreground/70",
};

type JobDraft = {
  id?: string;
  company: string;
  role_title: string;
  location: string;
  work_mode: string;
  salary_range: string;
  job_url: string;
  status: string;
  applied_on: string;
  follow_up_on: string;
  contact_name: string;
  contact_email: string;
  notes: string;
};

function emptyDraft(): JobDraft {
  return {
    company: "",
    role_title: "",
    location: "",
    work_mode: "remote",
    salary_range: "",
    job_url: "",
    status: "wishlist",
    applied_on: "",
    follow_up_on: "",
    contact_name: "",
    contact_email: "",
    notes: "",
  };
}

function toDraft(job: JobApplication): JobDraft {
  return {
    id: job.id,
    company: job.company,
    role_title: job.role_title,
    location: job.location ?? "",
    work_mode: job.work_mode,
    salary_range: job.salary_range ?? "",
    job_url: job.job_url ?? "",
    status: job.status,
    applied_on: job.applied_on ?? "",
    follow_up_on: job.follow_up_on ?? "",
    contact_name: job.contact_name ?? "",
    contact_email: job.contact_email ?? "",
    notes: job.notes ?? "",
  };
}

function JobsPage() {
  const qc = useQueryClient();
  const jobs = useQuery(jobApplicationsQuery());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const findCachedRow = (id: string): { id: string } | undefined =>
    (qc.getQueryData<JobApplication[]>(["job_applications"]) ?? []).find((row) => row.id === id);

  const saveJob = useMutation({
    mutationFn: async (value: JobDraft) => {
      const payload = {
        company: value.company.trim(),
        role_title: value.role_title.trim(),
        location: value.location.trim() || null,
        work_mode: value.work_mode,
        salary_range: value.salary_range.trim() || null,
        job_url: value.job_url.trim() || null,
        status: value.status,
        applied_on: value.applied_on || null,
        follow_up_on: value.follow_up_on || null,
        contact_name: value.contact_name.trim() || null,
        contact_email: value.contact_email.trim() || null,
        notes: value.notes.trim() || null,
      };
      if (value.id) {
        await updateRow("job_applications", findCachedRow(value.id) ?? { id: value.id }, payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("job_applications").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["job_applications"] });
      toast.success(value.id ? "Application updated" : "Application added");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchJob = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<JobApplication> }) =>
      updateRow("job_applications", findCachedRow(id) ?? { id }, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["job_applications"] });
      const previous = qc.getQueryData<JobApplication[]>(["job_applications"]);
      qc.setQueryData<JobApplication[]>(["job_applications"], (old) =>
        (old ?? []).map((j) => (j.id === id ? { ...j, ...patch } : j)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["job_applications"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["job_applications"] }),
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("job_applications").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job_applications"] });
      toast.success("Application deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (jobs.data ?? []).filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (!term) return true;
      return [j.company, j.role_title, j.location ?? "", j.notes ?? "", j.contact_name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [jobs.data, search, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const job of jobs.data ?? []) map[job.status] = (map[job.status] ?? 0) + 1;
    return map;
  }, [jobs.data]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Job Tracker</h1>
          <p className="text-xs text-muted-foreground">
            {(jobs.data ?? []).length} applications · {counts['interview'] ?? 0} interviewing ·{" "}
            {counts['offer'] ?? 0} offers
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role"
            className="h-8 w-52 pl-7 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {JOB_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-3.5" />
          Add application
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {jobs.isLoading ? (
            <LoadingState label="Loading applications…" />
          ) : jobs.isError ? (
            <ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="size-6" />}
              title={
                search || statusFilter !== "all" ? "No matching applications" : "No applications yet"
              }
              description="Track roles you want, applications you sent, and follow-up dates."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-3.5" />
                  Add application
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {visible.map((job) => (
                <article
                  key={job.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-medium">{job.role_title}</h2>
                      {job.job_url ? (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""} ·{" "}
                      {WORK_MODE_LABEL[job.work_mode] ?? job.work_mode}
                      {job.salary_range ? ` · ${job.salary_range}` : ""}
                    </p>
                  </div>

                  {job.follow_up_on ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {job.follow_up_on}
                    </span>
                  ) : null}

                  <Select
                    value={job.status}
                    onValueChange={(status) => patchJob.mutate({ id: job.id, patch: { status } })}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-7 w-28 border-0 text-[11px]",
                        STATUS_CLASS[job.status] ?? STATUS_CLASS['wishlist'],
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {JOB_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDraft(toDraft(job))}>
                        <Pencil className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          setConfirm({
                            title: "Delete application?",
                            description: `${job.role_title} at ${job.company} will be permanently deleted.`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteJob.mutate(job.id),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit application" : "Add application"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.company.trim() || !draft.role_title.trim()) {
                  toast.error("Company and role are required");
                  return;
                }
                saveJob.mutate(draft);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="j-company">Company</Label>
                  <Input
                    id="j-company"
                    value={draft.company}
                    onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="j-role">Role</Label>
                  <Input
                    id="j-role"
                    value={draft.role_title}
                    onChange={(e) => setDraft({ ...draft, role_title: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="j-loc">Location</Label>
                  <Input
                    id="j-loc"
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Work mode</Label>
                  <Select
                    value={draft.work_mode}
                    onValueChange={(work_mode) => setDraft({ ...draft, work_mode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {WORK_MODE_LABEL[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(status) => setDraft({ ...draft, status })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {JOB_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="j-salary">Salary range</Label>
                  <Input
                    id="j-salary"
                    value={draft.salary_range}
                    onChange={(e) => setDraft({ ...draft, salary_range: e.target.value })}
                    placeholder="₹12–18 LPA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="j-url">Job posting URL</Label>
                  <Input
                    id="j-url"
                    value={draft.job_url}
                    onChange={(e) => setDraft({ ...draft, job_url: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="j-applied">Applied on</Label>
                  <Input
                    id="j-applied"
                    type="date"
                    value={draft.applied_on}
                    onChange={(e) => setDraft({ ...draft, applied_on: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="j-follow">Follow up on</Label>
                  <Input
                    id="j-follow"
                    type="date"
                    value={draft.follow_up_on}
                    onChange={(e) => setDraft({ ...draft, follow_up_on: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="j-contact">Contact name</Label>
                  <Input
                    id="j-contact"
                    value={draft.contact_name}
                    onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="j-email">Contact email</Label>
                  <Input
                    id="j-email"
                    type="email"
                    value={draft.contact_email}
                    onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-notes">Notes</Label>
                <Textarea
                  id="j-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveJob.isPending}>
                  {saveJob.isPending ? "Saving…" : draft.id ? "Save changes" : "Add application"}
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