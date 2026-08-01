import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FilePlus2,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { NameDialog, type NameDialogState } from "@/components/name-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  noteFoldersQuery,
  notesQuery,
  requireUserId,
  runWithRetry,
  updateRow,
  subjectsQuery,
} from "@/lib/devos-queries";
import { SUBJECT_COLORS, type Note } from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  validateSearch: z.object({ note: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Notes — DevOS" },
      {
        name: "description",
        content:
          "Markdown notes organised as Subject → Folder → Note, with autosave, tags and full editing.",
      },
      { property: "og:title", content: "Notes — DevOS" },
      {
        property: "og:description",
        content: "Markdown notes organised as Subject → Folder → Note, with autosave and tags.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const navigate = useNavigate();
  const { note: selectedId } = useSearch({ from: "/_authenticated/notes" });
  const qc = useQueryClient();

  const subjects = useQuery(subjectsQuery());
  const folders = useQuery(noteFoldersQuery());
  const notes = useQuery(notesQuery());

  const [search, setSearch] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);

  /** Full row from the query cache — needed for the POST-upsert save fallback. */
  const findCachedRow = (key: string, id: string): { id: string } | undefined =>
    (qc.getQueryData<{ id: string }[]>([key]) ?? []).find((row) => row.id === id);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["subjects"] });
    void qc.invalidateQueries({ queryKey: ["note_folders"] });
    void qc.invalidateQueries({ queryKey: ["notes"] });
  };

  const selectNote = (id: string | undefined) =>
    void navigate({ to: "/notes", search: id ? { note: id } : {}, replace: true });

  const selectedNote = useMemo(
    () => notes.data?.find((n) => n.id === selectedId) ?? null,
    [notes.data, selectedId],
  );

  // Keep the ancestors of the selected note expanded.
  useEffect(() => {
    if (!selectedNote) return;
    setExpandedSubjects((prev) => new Set(prev).add(selectedNote.subject_id));
    if (selectedNote.folder_id) {
      setExpandedFolders((prev) => new Set(prev).add(selectedNote.folder_id!));
    }
  }, [selectedNote]);

  /* ---------------------------- mutations ---------------------------- */

  const createSubject = useMutation({
    mutationFn: async (name: string) => {
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const position = subjects.data?.length ?? 0;
        const color = SUBJECT_COLORS[position % SUBJECT_COLORS.length]!;
        const { error } = await supabase
          .from("subjects")
          .insert({ user_id, name, position, color });
        assertOk(error);
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Subject created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const renameRow = useMutation({
    mutationFn: async ({
      table,
      id,
      name,
    }: {
      table: "subjects" | "note_folders";
      id: string;
      name: string;
    }) => {
      await updateRow(table, findCachedRow(table, id) ?? { id }, { name });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Renamed");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteRow = useMutation({
    mutationFn: async ({
      table,
      id,
    }: {
      table: "subjects" | "note_folders" | "notes";
      id: string;
    }) => {
      await runWithRetry(async () => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        assertOk(error);
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const createFolder = useMutation({
    mutationFn: async ({ subjectId, name }: { subjectId: string; name: string }) => {
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const position = folders.data?.filter((f) => f.subject_id === subjectId).length ?? 0;
        const { error } = await supabase
          .from("note_folders")
          .insert({ user_id, subject_id: subjectId, name, position });
        assertOk(error);
      });
    },
    onSuccess: (_data, vars) => {
      invalidate();
      setExpandedSubjects((prev) => new Set(prev).add(vars.subjectId));
      toast.success("Folder created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const createNote = useMutation({
    mutationFn: async ({
      subjectId,
      folderId,
      title,
    }: {
      subjectId: string;
      folderId: string | null;
      title: string;
    }) => {
      return await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { data, error } = await supabase
          .from("notes")
          .insert({ user_id, subject_id: subjectId, folder_id: folderId, title })
          .select()
          .single();
        assertOk(error);
        return data!;
      });
    },
    onSuccess: (data) => {
      invalidate();
      selectNote(data.id);
      toast.success("Note created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const duplicateNote = useMutation({
    mutationFn: async (note: Note) => {
      return await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { data, error } = await supabase
          .from("notes")
          .insert({
            user_id,
            subject_id: note.subject_id,
            folder_id: note.folder_id,
            title: `${note.title} (copy)`,
            content_markdown: note.content_markdown,
            tags: note.tags,
          })
          .select()
          .single();
        assertOk(error);
        return data!;
      });
    },
    onSuccess: (data) => {
      invalidate();
      selectNote(data.id);
      toast.success("Note duplicated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Note> }) => {
      await updateRow("notes", findCachedRow("notes", id) ?? { id }, patch);
    },
    // Optimistic: sidebar title/pin updates instantly, rolled back if the save fails.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["notes"] });
      const previous = qc.getQueryData<Note[]>(["notes"]);
      qc.setQueryData<Note[]>(["notes"], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
      );
      return { previous };
    },
    onError: (e: unknown, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["notes"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  /* ------------------------------ render ----------------------------- */

  const isLoading = subjects.isLoading || folders.isLoading || notes.isLoading;
  const error = subjects.error ?? folders.error ?? notes.error;

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notes.data ?? [];
    return (notes.data ?? []).filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        n.content_markdown.toLowerCase().includes(term) ||
        n.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [notes.data, search]);

  const visibleNoteIds = useMemo(() => new Set(filteredNotes.map((n) => n.id)), [filteredNotes]);
  const searching = search.trim().length > 0;

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-screen md:h-screen md:min-h-0">
      {/* Tree */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="space-y-3 border-b border-border p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold">Notes</h1>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setNameDialog({
                  title: "New subject",
                  label: "Subject name",
                  submitLabel: "Create",
                  onSubmit: async (name) => {
                    await createSubject.mutateAsync(name);
                    setNameDialog(null);
                  },
                })
              }
            >
              <Plus className="size-4" />
              Subject
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <LoadingState label="Loading notes…" />
            ) : error ? (
              <ErrorState error={error} onRetry={() => invalidate()} />
            ) : (subjects.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Folder className="size-6" />}
                title="No subjects yet"
                description="Subjects are the top level: Subject → Folder → Note."
              />
            ) : (
              subjects.data!.map((subject) => {
                const subjectFolders = (folders.data ?? []).filter(
                  (f) => f.subject_id === subject.id,
                );
                const looseNotes = (notes.data ?? []).filter(
                  (n) => n.subject_id === subject.id && !n.folder_id,
                );
                const expanded = searching || expandedSubjects.has(subject.id);

                return (
                  <div key={subject.id} className="mb-1">
                    <Row
                      depth={0}
                      active={false}
                      expanded={expanded}
                      onToggle={() =>
                        setExpandedSubjects((prev) => {
                          const next = new Set(prev);
                          if (next.has(subject.id)) next.delete(subject.id);
                          else next.add(subject.id);
                          return next;
                        })
                      }
                      icon={
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                      }
                      label={subject.name}
                      bold
                      menu={
                        <>
                          <DropdownMenuItem
                            onSelect={() =>
                              setNameDialog({
                                title: "New folder",
                                label: "Folder name",
                                submitLabel: "Create",
                                onSubmit: async (name) => {
                                  await createFolder.mutateAsync({ subjectId: subject.id, name });
                                  setNameDialog(null);
                                },
                              })
                            }
                          >
                            <FolderPlus className="size-4" /> New folder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              createNote.mutate({
                                subjectId: subject.id,
                                folderId: null,
                                title: "Untitled note",
                              })
                            }
                          >
                            <FilePlus2 className="size-4" /> New note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              setNameDialog({
                                title: "Rename subject",
                                label: "Subject name",
                                initialValue: subject.name,
                                onSubmit: async (name) => {
                                  await renameRow.mutateAsync({
                                    table: "subjects",
                                    id: subject.id,
                                    name,
                                  });
                                  setNameDialog(null);
                                },
                              })
                            }
                          >
                            <Pencil className="size-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() =>
                              setConfirm({
                                title: `Delete "${subject.name}"?`,
                                description:
                                  "This permanently deletes the subject and every folder and note inside it.",
                                onConfirm: async () => {
                                  await deleteRow.mutateAsync({ table: "subjects", id: subject.id });
                                  setConfirm(null);
                                  if (selectedNote?.subject_id === subject.id) selectNote(undefined);
                                },
                              })
                            }
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      }
                    />

                    {expanded ? (
                      <>
                        {subjectFolders.map((folder) => {
                          const folderNotes = (notes.data ?? []).filter(
                            (n) => n.folder_id === folder.id,
                          );
                          const folderOpen = searching || expandedFolders.has(folder.id);
                          const shown = folderNotes.filter((n) => visibleNoteIds.has(n.id));
                          if (searching && shown.length === 0) return null;

                          return (
                            <div key={folder.id}>
                              <Row
                                depth={1}
                                active={false}
                                expanded={folderOpen}
                                onToggle={() =>
                                  setExpandedFolders((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(folder.id)) next.delete(folder.id);
                                    else next.add(folder.id);
                                    return next;
                                  })
                                }
                                icon={<Folder className="size-3.5" />}
                                label={folder.name}
                                badge={folderNotes.length || undefined}
                                menu={
                                  <>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        createNote.mutate({
                                          subjectId: subject.id,
                                          folderId: folder.id,
                                          title: "Untitled note",
                                        })
                                      }
                                    >
                                      <FilePlus2 className="size-4" /> New note
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setNameDialog({
                                          title: "Rename folder",
                                          label: "Folder name",
                                          initialValue: folder.name,
                                          onSubmit: async (name) => {
                                            await renameRow.mutateAsync({
                                              table: "note_folders",
                                              id: folder.id,
                                              name,
                                            });
                                            setNameDialog(null);
                                          },
                                        })
                                      }
                                    >
                                      <Pencil className="size-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={() =>
                                        setConfirm({
                                          title: `Delete "${folder.name}"?`,
                                          description:
                                            "The folder is removed. Its notes stay in the subject and move to the top level.",
                                          onConfirm: async () => {
                                            await deleteRow.mutateAsync({
                                              table: "note_folders",
                                              id: folder.id,
                                            });
                                            setConfirm(null);
                                          },
                                        })
                                      }
                                    >
                                      <Trash2 className="size-4" /> Delete folder
                                    </DropdownMenuItem>
                                  </>
                                }
                              />
                              {folderOpen
                                ? shown.map((note) => (
                                    <NoteRow
                                      key={note.id}
                                      note={note}
                                      depth={2}
                                      active={note.id === selectedId}
                                      onSelect={() => selectNote(note.id)}
                                      onDuplicate={() => duplicateNote.mutate(note)}
                                      onDelete={() =>
                                        setConfirm({
                                          title: `Delete "${note.title}"?`,
                                          description: "This note will be permanently deleted.",
                                          onConfirm: async () => {
                                            await deleteRow.mutateAsync({
                                              table: "notes",
                                              id: note.id,
                                            });
                                            setConfirm(null);
                                            if (selectedId === note.id) selectNote(undefined);
                                          },
                                        })
                                      }
                                    />
                                  ))
                                : null}
                            </div>
                          );
                        })}

                        {looseNotes
                          .filter((n) => visibleNoteIds.has(n.id))
                          .map((note) => (
                            <NoteRow
                              key={note.id}
                              note={note}
                              depth={1}
                              active={note.id === selectedId}
                              onSelect={() => selectNote(note.id)}
                              onDuplicate={() => duplicateNote.mutate(note)}
                              onDelete={() =>
                                setConfirm({
                                  title: `Delete "${note.title}"?`,
                                  description: "This note will be permanently deleted.",
                                  onConfirm: async () => {
                                    await deleteRow.mutateAsync({ table: "notes", id: note.id });
                                    setConfirm(null);
                                    if (selectedId === note.id) selectNote(undefined);
                                  },
                                })
                              }
                            />
                          ))}
                      </>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="min-w-0 flex-1">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            subjects={subjects.data ?? []}
            folders={folders.data ?? []}
            onPatch={(patch) => updateNote.mutateAsync({ id: selectedNote.id, patch })}
            onDuplicate={() => duplicateNote.mutate(selectedNote)}
            onDelete={() =>
              setConfirm({
                title: `Delete "${selectedNote.title}"?`,
                description: "This note will be permanently deleted.",
                onConfirm: async () => {
                  await deleteRow.mutateAsync({ table: "notes", id: selectedNote.id });
                  setConfirm(null);
                  selectNote(undefined);
                },
              })
            }
          />
        ) : (
          <EmptyState
            icon={<FileText className="size-7" />}
            title="No note selected"
            description="Pick a note from the tree, or create a subject to get started."
          />
        )}
      </div>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
      <NameDialog state={nameDialog} onOpenChange={(open) => !open && setNameDialog(null)} />
    </div>
  );
}

/* ------------------------------- rows -------------------------------- */

function Row({
  depth,
  label,
  icon,
  expanded,
  onToggle,
  onSelect,
  active,
  menu,
  badge,
  bold,
  trailing,
}: {
  depth: number;
  label: string;
  icon: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
  active: boolean;
  menu?: React.ReactNode;
  badge?: number | undefined;
  bold?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-lg pr-1 transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
      style={{ paddingLeft: depth * 12 }}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="p-1 text-muted-foreground"
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      ) : (
        <span className="w-[22px]" />
      )}
      <button
        type="button"
        onClick={onSelect ?? onToggle}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm",
          bold ? "font-medium" : "text-muted-foreground group-hover:text-foreground",
          active && "text-foreground",
        )}
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center">{icon}</span>
        <span className="truncate">{label}</span>
        {trailing}
        {badge ? (
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </button>
      {menu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Actions"
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

function NoteRow({
  note,
  depth,
  active,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  note: Note;
  depth: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Row
      depth={depth}
      active={active}
      icon={
        note.pinned ? (
          <Star className="size-3.5 fill-primary text-primary" />
        ) : (
          <FileText className="size-3.5" />
        )
      }
      label={note.title || "Untitled"}
      onSelect={onSelect}
      menu={
        <>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy className="size-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </>
      }
    />
  );
}

/* ------------------------------ editor ------------------------------- */

function NoteEditor({
  note,
  subjects,
  folders,
  onPatch,
  onDuplicate,
  onDelete,
}: {
  note: Note;
  subjects: { id: string; name: string }[];
  folders: { id: string; name: string; subject_id: string }[];
  onPatch: (patch: Partial<Note>) => Promise<unknown>;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content_markdown);
  const [tagInput, setTagInput] = useState(note.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);

  const draftRef = useRef({ title, content, tagInput });
  draftRef.current = { title, content, tagInput };

  // Real save: only reports "Saved" once the database confirmed the write.
  const save = async () => {
    const { title: t, content: c, tagInput: tg } = draftRef.current;
    setStatus("saving");
    try {
      await onPatch({
        title: t.trim() || "Untitled",
        content_markdown: c,
        tags: tg
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setStatus("saved");
    } catch {
      // The mutation already surfaced a human-readable toast.
      setStatus("error");
    }
  };

  const saveRef = useRef(save);
  saveRef.current = save;

  // Debounced autosave for title / content / tags.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("unsaved");
    const timer = setTimeout(() => void saveRef.current(), 700);
    return () => clearTimeout(timer);
  }, [title, content, tagInput]);

  // Manual save with Cmd/Ctrl+S.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warn before losing unsaved edits.
  useEffect(() => {
    if (status !== "unsaved" && status !== "error") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  const moveValue = note.folder_id ? `folder:${note.folder_id}` : `subject:${note.subject_id}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <Select
          value={moveValue}
          onValueChange={(value) => {
            const [kind, id] = value.split(":") as ["folder" | "subject", string];
            if (kind === "folder") {
              const folder = folders.find((f) => f.id === id);
              if (!folder) return;
              void onPatch({ folder_id: folder.id, subject_id: folder.subject_id });
            } else {
              void onPatch({ folder_id: null, subject_id: id });
            }
            toast.success("Note moved");
          }}
        >
          <SelectTrigger className="h-8 w-auto min-w-52 text-xs">
            <SelectValue placeholder="Move to…" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => [
              <SelectItem key={subject.id} value={`subject:${subject.id}`}>
                {subject.name} · top level
              </SelectItem>,
              ...folders
                .filter((f) => f.subject_id === subject.id)
                .map((folder) => (
                  <SelectItem key={folder.id} value={`folder:${folder.id}`}>
                    {subject.name} / {folder.name}
                  </SelectItem>
                )),
            ])}
          </SelectContent>
        </Select>

        <span
          className={cn(
            "text-xs",
            status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved"
              : status === "unsaved"
                ? "Unsaved changes…"
                : status === "error"
                  ? "Not saved — retry"
                  : "Autosave on"}
        </span>
        <Button
          variant={status === "error" ? "destructive" : "ghost"}
          size="sm"
          disabled={status === "saving"}
          onClick={() => void save()}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onPatch({ pinned: !note.pinned })}
            aria-pressed={note.pinned}
          >
            <Star className={cn("size-4", note.pinned && "fill-primary text-primary")} />
            {note.pinned ? "Pinned" : "Pin"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
            {preview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-b border-border px-5 py-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Tags, comma separated"
          className="h-8 border-dashed text-xs"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {preview ? (
          content.trim() ? (
            <div className="md-body max-w-3xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <EmptyState title="Nothing to preview" description="Write some markdown first." />
          )
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write in markdown…"
            className="h-full min-h-[50vh] resize-none border-none bg-transparent p-0 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0"
          />
        )}
      </div>
    </div>
  );
}