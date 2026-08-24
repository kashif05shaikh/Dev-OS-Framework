import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Printer,
  Trash2,
  Upload,
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  describeError,
  requireUserId,
  resumeFilesQuery,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import type { ResumeFile } from "@/lib/devos-types";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Library — DevOS" },
      {
        name: "description",
        content:
          "Upload your resume from your computer, keep every version in one place, rename or replace it and print it to PDF.",
      },
      { property: "og:title", content: "Resume Library — DevOS" },
      {
        property: "og:description",
        content: "Upload, preview, edit and print your developer resume files.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResumePage,
});

const ACCEPT = ".pdf,.doc,.docx,.rtf,.txt,.odt,application/pdf";
const BUCKET = "resume-files";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open the file");
  return data.signedUrl;
}

async function uploadResumeFile(file: File): Promise<{
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}> {
  const userId = await requireUserId();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return {
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
  };
}

function ResumePage() {
  const qc = useQueryClient();
  const files = useQuery(resumeFilesQuery());

  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [editing, setEditing] = useState<ResumeFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);

  const list = files.data ?? [];
  const active = useMemo(
    () => list.find((f) => f.id === activeId) ?? list[0] ?? null,
    [list, activeId],
  );

  const isPdf =
    (active?.mime_type ?? "").includes("pdf") ||
    (active?.file_name ?? "").toLowerCase().endsWith(".pdf");

  useEffect(() => {
    let cancelled = false;
    setPreviewUrl(null);
    if (!active?.file_path) return;
    void signedUrl(active.file_path)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch((e: unknown) => toast.error(describeError(e)));
    return () => {
      cancelled = true;
    };
  }, [active?.file_path]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["resume_files"] });

  const addFile = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadResumeFile(file);
      const user_id = await requireUserId();
      return runWithRetry(async () => {
        const { data, error } = await supabase
          .from("resume_files")
          .insert({
            user_id,
            title: file.name.replace(/\.[^.]+$/, "") || "My resume",
            ...uploaded,
          })
          .select("id")
          .single();
        assertOk(error);
        return data!.id as string;
      });
    },
    onSuccess: (id) => {
      setActiveId(id);
      invalidate();
      toast.success("Resume uploaded");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchFile = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ResumeFile> }) => {
      const cached = (qc.getQueryData<ResumeFile[]>(["resume_files"]) ?? []).find(
        (f) => f.id === id,
      ) ?? { id };
      await updateRow("resume_files", cached as { id: string }, patch as Record<string, unknown>);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Resume updated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteFile = useMutation({
    mutationFn: async (row: ResumeFile) =>
      runWithRetry(async () => {
        await supabase.storage.from(BUCKET).remove([row.file_path]);
        const { error } = await supabase.from("resume_files").delete().eq("id", row.id);
        assertOk(error);
      }),
    onSuccess: () => {
      setActiveId(null);
      invalidate();
      toast.success("Resume deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  async function handlePick(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await addFile.mutateAsync(file);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function openInTab(row: ResumeFile) {
    try {
      const url = await signedUrl(row.file_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      toast.error(describeError(e));
    }
  }

  async function download(row: ResumeFile) {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(row.file_path);
      if (error || !data) throw error ?? new Error("Download failed");
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast.error(describeError(e));
    }
  }

  function printActive() {
    const frame = document.getElementById("resume-preview") as HTMLIFrameElement | null;
    try {
      frame?.contentWindow?.focus();
      frame?.contentWindow?.print();
      return;
    } catch {
      /* cross-origin viewers block programmatic print */
    }
    if (active) void openInTab(active);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-sm font-semibold">Resume</h1>
          <p className="truncate text-xs text-muted-foreground">
            Upload a resume from your computer, then edit details or print it.
          </p>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void handlePick(e.target.files?.[0])}
        />
        <Button
          size="sm"
          className="h-8"
          disabled={uploading}
          onClick={() => uploadRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {uploading ? "Uploading…" : "Upload resume"}
        </Button>
      </header>

      {files.isLoading ? (
        <LoadingState label="Loading resumes…" />
      ) : files.isError ? (
        <ErrorState error={files.error} onRetry={() => void files.refetch()} />
      ) : !active ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="No resume uploaded"
          description="Browse your computer and upload a PDF or Word resume. You can keep multiple versions here."
          action={
            <Button size="sm" onClick={() => uploadRef.current?.click()} disabled={uploading}>
              <Upload className="size-3.5" />
              Choose file
            </Button>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-stretch">
          <aside className="hidden w-64 shrink-0 border-r border-border md:block">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {list.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setActiveId(row.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      row.id === active.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="truncate text-[11px] opacity-70">
                      {row.file_name}
                      {row.file_size ? ` · ${formatSize(row.file_size)}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <div className="mr-auto min-w-0">
                <p className="truncate text-sm font-medium">{active.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {active.file_name}
                  {active.file_size ? ` · ${formatSize(active.file_size)}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setEditing(active)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={printActive}>
                <Printer className="size-3.5" />
                Print / PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => void download(active)}
              >
                <Download className="size-3.5" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => void openInTab(active)}
              >
                <ExternalLink className="size-3.5" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() =>
                  setConfirm({
                    title: "Delete resume?",
                    description: `"${active.title}" and its uploaded file will be permanently deleted.`,
                    confirmLabel: "Delete",
                    onConfirm: () => deleteFile.mutate(active),
                  })
                }
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>

            <div className="min-h-[calc(100vh-8rem)] flex-1 bg-muted/20 p-4">
              {!previewUrl ? (
                <LoadingState label="Opening resume…" />
              ) : isPdf ? (
                <iframe
                  id="resume-preview"
                  title={`${active.title} preview`}
                  src={`${previewUrl}#view=FitH&toolbar=1`}
                  className="h-full min-h-[calc(100vh-9rem)] w-full rounded-xl border border-border bg-white"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Preview is only available for PDF files. Download or open{" "}
                    {active.file_name} to view it.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => void download(active)}>
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <EditResumeDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) patchFile.mutate({ id: editing.id, patch });
          setEditing(null);
        }}
        onReplace={async (file) => {
          if (!editing) return;
          try {
            const uploaded = await uploadResumeFile(file);
            const oldPath = editing.file_path;
            await patchFile.mutateAsync({ id: editing.id, patch: uploaded });
            await supabase.storage.from(BUCKET).remove([oldPath]);
            setEditing(null);
          } catch (e: unknown) {
            toast.error(describeError(e));
          }
        }}
      />

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}

function EditResumeDialog({
  row,
  onClose,
  onSave,
  onReplace,
}: {
  row: ResumeFile | null;
  onClose: () => void;
  onSave: (patch: Partial<ResumeFile>) => void;
  onReplace: (file: File) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [replacing, setReplacing] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(row?.title ?? "");
    setNotes(row?.notes ?? "");
  }, [row]);

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="resume-title">Title</Label>
            <Input
              id="resume-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Backend SDE resume"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resume-notes">Notes</Label>
            <Textarea
              id="resume-notes"
              value={notes}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tailored for backend roles, updated Aug 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <p className="truncate text-xs text-muted-foreground">{row?.file_name}</p>
            <input
              ref={replaceRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setReplacing(true);
                await onReplace(file);
                setReplacing(false);
                if (replaceRef.current) replaceRef.current.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={replacing}
              onClick={() => replaceRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {replacing ? "Replacing…" : "Replace file"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onSave({ title: title.trim() || "My resume", notes: notes.trim() || null })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
