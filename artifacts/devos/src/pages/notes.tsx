import { useState, useRef, useEffect, useCallback } from "react";
import {
  useListNotes, useListNoteFolders, useGetNote,
  useCreateNote, useUpdateNote, useDeleteNote, useDuplicateNote,
  useCreateNoteFolder, useUpdateNoteFolder, useDeleteNoteFolder,
  getListNotesQueryKey, getListNoteFoldersQueryKey, getGetNoteQueryKey,
} from "@workspace/api-client-react";
import type { NoteFolder, Note } from "@workspace/api-client-react";
import {
  BookOpen, Folder, FolderOpen, FileText, Plus, Pin, Trash2,
  MoreVertical, X, Eye, Edit3, Copy, FolderInput, Search, ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

// ─── Dialogs ─────────────────────────────────────────────────────────────────

function InputDialog({
  open, title, label, defaultValue = "", onConfirm, onClose,
}: {
  open: boolean; title: string; label: string;
  defaultValue?: string; onConfirm: (val: string) => void; onClose: () => void;
}) {
  const [val, setVal] = useState(defaultValue);
  useEffect(() => { if (open) setVal(defaultValue); }, [open, defaultValue]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="py-2">
          <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onConfirm(val.trim()); onClose(); } }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (val.trim()) { onConfirm(val.trim()); onClose(); } }} disabled={!val.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open, entityName, onConfirm, onClose,
}: {
  open: boolean; entityName: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{entityName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { onConfirm(); onClose(); }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MoveNoteDialog({
  open, folders, currentFolderId, onConfirm, onClose,
}: {
  open: boolean;
  folders: NoteFolder[];
  currentFolderId: number | null | undefined;
  onConfirm: (folderId: number | null) => void;
  onClose: () => void;
}) {
  const subjects = folders.filter((f) => !f.parentId);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>Move note to…</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-64">
          <div className="flex flex-col gap-1 py-2">
            <button
              onClick={() => { onConfirm(null); onClose(); }}
              className={cn(
                "text-left px-3 py-2 rounded-md text-sm hover:bg-secondary",
                currentFolderId == null && "bg-secondary font-semibold",
              )}
            >
              Unfiled
            </button>
            {subjects.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => { onConfirm(s.id); onClose(); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary flex items-center gap-2",
                    currentFolderId === s.id && "bg-secondary font-semibold",
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.name}
                </button>
                {folders.filter((f) => f.parentId === s.id).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { onConfirm(f.id); onClose(); }}
                    className={cn(
                      "w-full text-left pl-8 pr-3 py-2 rounded-md text-sm hover:bg-secondary flex items-center gap-2",
                      currentFolderId === f.id && "bg-secondary font-semibold",
                    )}
                  >
                    <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                    {f.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Subject Sidebar ──────────────────────────────────────────────────────────

function SubjectSidebar({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onCreate,
  onRename,
  onDelete,
  onAddFolder,
}: {
  subjects: NoteFolder[];
  selectedSubjectId: number | null;
  onSelectSubject: (id: number | null) => void;
  onCreate: () => void;
  onRename: (s: NoteFolder) => void;
  onDelete: (s: NoteFolder) => void;
  onAddFolder: (s: NoteFolder) => void;
}) {
  return (
    <div className="w-44 border-r border-border bg-secondary/10 flex flex-col flex-shrink-0 hidden md:flex">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Subjects</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCreate} title="New subject">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 flex flex-col gap-0.5">
          <button
            onClick={() => onSelectSubject(null)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left w-full",
              selectedSubjectId === null
                ? "bg-primary text-primary-foreground font-semibold"
                : "hover:bg-secondary text-foreground",
            )}
          >
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">All Notes</span>
          </button>

          {subjects.map((s) => (
            <div key={s.id} className="flex items-center group">
              <button
                onClick={() => onSelectSubject(s.id)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left min-w-0",
                  selectedSubjectId === s.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-secondary text-foreground",
                )}
              >
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{s.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAddFolder(s)}>
                    <Folder className="h-3.5 w-3.5 mr-2" /> Add folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRename(s)}>
                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(s)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Per-folder note fetcher ──────────────────────────────────────────────────

/** Fetches notes for a specific folderId independently — avoids coupling section
 *  rendering to the parent's selectedFolderId query scope. */
function useFolderNotes(folderId: number) {
  return useListNotes({ folderId }, { query: { enabled: true } as any });
}

// ─── Notes Panel (middle) ─────────────────────────────────────────────────────

function NoteItem({
  note,
  isActive,
  onClick,
  onDuplicate,
  onMove,
  onDelete,
}: {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-1 px-1 border-b border-border/50 transition-colors",
        isActive ? "bg-secondary/80 border-l-2 border-l-primary" : "hover:bg-secondary/30 border-l-2 border-l-transparent",
      )}
    >
      <button onClick={onClick} className="flex-1 text-left p-3 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {note.pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
          <span className="font-semibold text-sm truncate leading-none">{note.title || "Untitled"}</span>
        </div>
        <span className="text-xs text-muted-foreground line-clamp-2 opacity-75">
          {note.contentMarkdown?.substring(0, 80) || "Empty note"}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMove}>
            <FolderInput className="h-3.5 w-3.5 mr-2" /> Move to…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FolderSection({
  folder,
  activeNoteId,
  onNoteClick,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  onRenameFolder,
  onDeleteFolder,
  onAddNote,
  defaultExpanded,
}: {
  folder: NoteFolder;
  activeNoteId: number | null;
  onNoteClick: (id: number) => void;
  onDuplicateNote: (n: Note) => void;
  onMoveNote: (n: Note) => void;
  onDeleteNote: (n: Note) => void;
  onRenameFolder: (f: NoteFolder) => void;
  onDeleteFolder: (f: NoteFolder) => void;
  onAddNote: (folderId: number) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true);
  // Each section fetches its own notes independently — avoids coupling to
  // parent selectedFolderId state which would blank out sibling sections.
  const { data: notes = [] } = useFolderNotes(folder.id);
  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1.5 group bg-secondary/20 border-b border-border/30">
        <button
          onClick={() => setExpanded((x) => !x)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")}
          />
          {expanded
            ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            : <Folder className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground truncate">
            {folder.name}
          </span>
          <span className="text-[10px] text-muted-foreground/60">({notes.length})</span>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="icon" className="h-5 w-5"
            onClick={() => onAddNote(folder.id)} title="New note"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder(folder)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {expanded && notes.map((n) => (
        <NoteItem
          key={n.id}
          note={n}
          isActive={activeNoteId === n.id}
          onClick={() => onNoteClick(n.id)}
          onDuplicate={() => onDuplicateNote(n)}
          onMove={() => onMoveNote(n)}
          onDelete={() => onDeleteNote(n)}
        />
      ))}
      {expanded && notes.length === 0 && (
        <div className="px-4 py-3 text-xs text-muted-foreground italic">No notes yet.</div>
      )}
    </div>
  );
}

// ─── Note Editor ──────────────────────────────────────────────────────────────

function NoteEditor({
  noteId,
  onClose,
  allFolders,
}: {
  noteId: number;
  onClose: () => void;
  allFolders: NoteFolder[];
}) {
  const { data: note, isLoading } = useGetNote(noteId, { query: { enabled: !!noteId } as any });
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "edited">("saved");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const initializedForId = useRef<number | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear pending autosave on unmount or note switch to prevent stale mutations.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [noteId]);

  useEffect(() => {
    if (note && initializedForId.current !== noteId) {
      initializedForId.current = noteId;
      setTitle(note.title);
      setContent(note.contentMarkdown || "");
      setSaveStatus("saved");
      setPreview(false);
    }
  }, [note, noteId]);

  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      setSaveStatus("edited");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus("saving");
        updateNote.mutate(
          { id: noteId, data: { title: newTitle, contentMarkdown: newContent } },
          {
            onSuccess: (updated) => {
              setSaveStatus("saved");
              qc.setQueryData(getGetNoteQueryKey(noteId), updated);
              qc.invalidateQueries({ queryKey: getListNotesQueryKey() });
            },
            onError: () => setSaveStatus("edited"),
          },
        );
      }, 1000);
    },
    [noteId, updateNote, qc],
  );

  const handleTogglePin = () => {
    if (!note) return;
    updateNote.mutate(
      { id: noteId, data: { pinned: !note.pinned } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotesQueryKey() }) },
    );
  };

  const handleDelete = () => {
    deleteNote.mutate(
      { id: noteId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListNotesQueryKey() });
          onClose();
        },
      },
    );
  };

  if (isLoading || initializedForId.current !== noteId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <FileText className="animate-pulse opacity-20 h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border",
              saveStatus === "saved"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : saveStatus === "saving"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : "bg-orange-500/10 text-orange-600 border-orange-500/20",
            )}
          >
            {saveStatus}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={preview ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleTogglePin}
            title={note?.pinned ? "Unpin" : "Pin"}
          >
            <Pin className={cn("h-4 w-4", note?.pinned && "fill-primary text-primary")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-6 pb-3 flex-shrink-0">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave(e.target.value, content);
            }}
            className="w-full text-3xl font-extrabold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
            placeholder="Note Title"
          />
        </div>

        {preview ? (
          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{content || "*Empty note — switch to Edit to start writing.*"}</ReactMarkdown>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1 px-8 pb-8">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                scheduleSave(title, e.target.value);
              }}
              className="min-h-[500px] border-none shadow-none focus-visible:ring-0 px-0 resize-none font-mono text-sm leading-relaxed bg-transparent"
              placeholder="Write markdown here…"
            />
          </ScrollArea>
        )}
      </div>

      <DeleteDialog
        open={showDeleteDialog}
        entityName={title || "Untitled"}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

// ─── Unfiled Section (type-safe alternative to synthetic NoteFolder) ─────────

function UnfiledSection({
  subjectId,
  hasOtherFolders,
  activeNoteId,
  onNoteClick,
  onDuplicateNote,
  onMoveNote,
  onDeleteNote,
  onAddNote,
}: {
  subjectId: number;
  hasOtherFolders: boolean;
  activeNoteId: number | null;
  onNoteClick: (id: number) => void;
  onDuplicateNote: (n: Note) => void;
  onMoveNote: (n: Note) => void;
  onDeleteNote: (n: Note) => void;
  onAddNote: (folderId?: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  // Notes filed directly under the subject (not in any child folder)
  const { data: notes = [] } = useListNotes({ folderId: subjectId }, { query: { enabled: true } as any });
  if (notes.length === 0 && hasOtherFolders) return null;
  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1.5 group bg-secondary/20 border-b border-border/30">
        <button onClick={() => setExpanded((x) => !x)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground truncate">Unfiled</span>
          <span className="text-[10px] text-muted-foreground/60">({notes.length})</span>
        </button>
        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onAddNote(subjectId)} title="New note">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {expanded && notes.map((n) => (
        <NoteItem
          key={n.id}
          note={n}
          isActive={activeNoteId === n.id}
          onClick={() => onNoteClick(n.id)}
          onDuplicate={() => onDuplicateNote(n)}
          onMove={() => onMoveNote(n)}
          onDelete={() => onDeleteNote(n)}
        />
      ))}
      {expanded && notes.length === 0 && (
        <div className="px-4 py-3 text-xs text-muted-foreground italic">No unfiled notes.</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const qc = useQueryClient();

  // Selection state — no selectedFolderId; FolderSection/UnfiledSection each
  // fetch their own notes independently to avoid cross-section query coupling.
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Data
  const { data: allFolders = [] } = useListNoteFolders();
  const subjects = allFolders.filter((f) => !f.parentId);
  const foldersInSubject = allFolders.filter((f) => f.parentId === selectedSubjectId);

  // Flat notes query — used only for "All Notes" view and search.
  const flatParams = search ? { q: search } : {};
  const { data: flatNotes = [], isLoading: notesLoading } = useListNotes(flatParams, {
    query: { enabled: !selectedSubjectId || !!search } as any,
  });

  // Mutations
  const createNote = useCreateNote();
  const createFolder = useCreateNoteFolder();
  const updateFolder = useUpdateNoteFolder();
  const deleteFolder = useDeleteNoteFolder();
  const deleteNote = useDeleteNote();
  const duplicateNote = useDuplicateNote();

  // Dialog state
  type DialogState =
    | { type: "createSubject" }
    | { type: "createFolder"; parentId: number }
    | { type: "renameFolder"; folder: NoteFolder }
    | { type: "deleteFolder"; folder: NoteFolder }
    | { type: "deleteNote"; note: Note }
    | { type: "moveNote"; note: Note }
    | null;
  const [dialog, setDialog] = useState<DialogState>(null);

  // ── Handlers ──

  const invalidateFolders = () => qc.invalidateQueries({ queryKey: getListNoteFoldersQueryKey() });
  const invalidateNotes = () => qc.invalidateQueries({ queryKey: getListNotesQueryKey() });

  const handleCreateSubject = (name: string) => {
    createFolder.mutate({ data: { name } }, { onSuccess: invalidateFolders });
  };

  const handleCreateFolder = (name: string, parentId: number) => {
    createFolder.mutate(
      { data: { name, parentId } },
      { onSuccess: invalidateFolders },
    );
  };

  const handleRenameFolder = (name: string, folder: NoteFolder) => {
    updateFolder.mutate(
      { id: folder.id, data: { name } },
      { onSuccess: invalidateFolders },
    );
  };

  const handleDeleteFolder = (folder: NoteFolder) => {
    deleteFolder.mutate(
      { id: folder.id },
      {
        onSuccess: () => {
          invalidateFolders();
          if (selectedSubjectId === folder.id) setSelectedSubjectId(null);
          invalidateNotes();
        },
      },
    );
  };

  const handleCreateNote = (folderId?: number) => {
    const targetFolderId = folderId;
    createNote.mutate(
      { data: { title: "Untitled Note", folderId: targetFolderId, contentMarkdown: "" } },
      {
        onSuccess: (n) => {
          invalidateNotes();
          setActiveNoteId(n.id);
        },
      },
    );
  };

  const handleDeleteNote = (note: Note) => {
    deleteNote.mutate(
      { id: note.id },
      {
        onSuccess: () => {
          invalidateNotes();
          if (activeNoteId === note.id) setActiveNoteId(null);
        },
      },
    );
  };

  const handleDuplicateNote = (note: Note) => {
    duplicateNote.mutate(
      { id: note.id },
      {
        onSuccess: (dup) => {
          invalidateNotes();
          setActiveNoteId(dup.id);
        },
      },
    );
  };

  const updateNote = useUpdateNote();
  const moveNote = (note: Note, folderId: number | null) => {
    updateNote.mutate(
      { id: note.id, data: { folderId } },
      { onSuccess: invalidateNotes },
    );
  };

  const handleSelectSubject = (id: number | null) => {
    setSelectedSubjectId(id);
    setActiveNoteId(null);
    setSearch("");
  };

  // ── Layout ──
  const showEditor = activeNoteId !== null;

  return (
    <div className="flex h-full border border-border bg-card rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">

      {/* Subject Sidebar */}
      <SubjectSidebar
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={handleSelectSubject}
        onCreate={() => setDialog({ type: "createSubject" })}
        onRename={(s) => setDialog({ type: "renameFolder", folder: s })}
        onDelete={(s) => setDialog({ type: "deleteFolder", folder: s })}
        onAddFolder={(s) => setDialog({ type: "createFolder", parentId: s.id })}
      />

      {/* Middle Panel: Folder tree + Note list */}
      <div className={cn(
        "w-full md:w-72 border-r border-border bg-card flex flex-col flex-shrink-0",
        showEditor ? "hidden md:flex" : "flex",
      )}>
        {/* Header */}
        <div className="p-2 border-b border-border flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-bold px-2 gap-1 flex-shrink-0"
            onClick={() => handleCreateNote()}
          >
            <Plus className="h-3 w-3" /> New
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {notesLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : search || !selectedSubjectId ? (
            /* Flat list when searching or "All Notes" selected */
            <div className="divide-y divide-border/50">
              {flatNotes.map((n) => (
                <NoteItem
                  key={n.id}
                  note={n}
                  isActive={activeNoteId === n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  onDuplicate={() => handleDuplicateNote(n)}
                  onMove={() => setDialog({ type: "moveNote", note: n })}
                  onDelete={() => setDialog({ type: "deleteNote", note: n })}
                />
              ))}
              {flatNotes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  {search ? "No matching notes." : "No notes yet. Create one!"}
                </div>
              )}
            </div>
          ) : (
            /* Folder sections when a subject is selected */
            <div>
              {foldersInSubject.map((folder) => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  activeNoteId={activeNoteId}
                  onNoteClick={(id) => setActiveNoteId(id)}
                  onDuplicateNote={handleDuplicateNote}
                  onMoveNote={(n) => setDialog({ type: "moveNote", note: n })}
                  onDeleteNote={(n) => setDialog({ type: "deleteNote", note: n })}
                  onRenameFolder={(f) => setDialog({ type: "renameFolder", folder: f })}
                  onDeleteFolder={(f) => setDialog({ type: "deleteFolder", folder: f })}
                  onAddNote={(fid) => handleCreateNote(fid)}
                  defaultExpanded
                />
              ))}
              {/* Unfiled notes filed directly under the subject — typed separately to avoid as-any */}
              <UnfiledSection
                subjectId={selectedSubjectId!}
                hasOtherFolders={foldersInSubject.length > 0}
                activeNoteId={activeNoteId}
                onNoteClick={(id) => setActiveNoteId(id)}
                onDuplicateNote={handleDuplicateNote}
                onMoveNote={(n) => setDialog({ type: "moveNote", note: n })}
                onDeleteNote={(n) => setDialog({ type: "deleteNote", note: n })}
                onAddNote={handleCreateNote}
              />
              {foldersInSubject.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No folders or notes yet.
                  <br />
                  <button
                    className="underline text-primary mt-1 text-xs"
                    onClick={() => setDialog({ type: "createFolder", parentId: selectedSubjectId! })}
                  >
                    Add a folder
                  </button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className={cn("flex-1 bg-background flex flex-col min-w-0", !showEditor ? "hidden md:flex" : "flex")}>
        {activeNoteId ? (
          <NoteEditor
            key={activeNoteId}
            noteId={activeNoteId}
            onClose={() => setActiveNoteId(null)}
            allFolders={allFolders}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest font-bold">Select or create a note</p>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}

      <InputDialog
        open={dialog?.type === "createSubject"}
        title="New Subject"
        label="Subject name"
        onConfirm={handleCreateSubject}
        onClose={() => setDialog(null)}
      />

      <InputDialog
        open={dialog?.type === "createFolder"}
        title="New Folder"
        label="Folder name"
        onConfirm={(name) => {
          if (dialog?.type === "createFolder") handleCreateFolder(name, dialog.parentId);
        }}
        onClose={() => setDialog(null)}
      />

      <InputDialog
        open={dialog?.type === "renameFolder"}
        title="Rename"
        label="New name"
        defaultValue={dialog?.type === "renameFolder" ? dialog.folder.name : ""}
        onConfirm={(name) => {
          if (dialog?.type === "renameFolder") handleRenameFolder(name, dialog.folder);
        }}
        onClose={() => setDialog(null)}
      />

      <DeleteDialog
        open={dialog?.type === "deleteFolder"}
        entityName={dialog?.type === "deleteFolder" ? dialog.folder.name : ""}
        onConfirm={() => {
          if (dialog?.type === "deleteFolder") handleDeleteFolder(dialog.folder);
        }}
        onClose={() => setDialog(null)}
      />

      <DeleteDialog
        open={dialog?.type === "deleteNote"}
        entityName={dialog?.type === "deleteNote" ? (dialog.note.title || "Untitled") : ""}
        onConfirm={() => {
          if (dialog?.type === "deleteNote") handleDeleteNote(dialog.note);
        }}
        onClose={() => setDialog(null)}
      />

      {dialog?.type === "moveNote" && (
        <MoveNoteDialog
          open
          folders={allFolders}
          currentFolderId={dialog.note.folderId}
          onConfirm={(folderId) => moveNote(dialog.note, folderId)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
