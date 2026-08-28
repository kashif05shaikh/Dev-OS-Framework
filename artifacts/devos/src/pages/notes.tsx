import { useEffect, useMemo, useRef, useState } from "react";
import {
  getGetNoteQueryKey,
  getListNoteFoldersQueryKey,
  getListNotesQueryKey,
  useCreateNote,
  useCreateNoteFolder,
  useDeleteNote,
  useDeleteNoteFolder,
  useGetNote,
  useListNoteFolders,
  useListNotes,
  useUpdateNote,
  useUpdateNoteFolder,
  type NoteFolder,
} from "@workspace/api-client-react";
import { ChevronDown, FileText, Folder, FolderPlus, MoreVertical, Pin, Plus, Search, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALL_FOLDERS = "all";

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function NotesPage() {
  const [, setLocation] = useLocation();
  const activeNoteId = Number(new URLSearchParams(window.location.search).get("id")) || null;
  const [folderId, setFolderId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "title">("updated");
  const [folderDialog, setFolderDialog] = useState<{ folder?: NoteFolder; parentId: number | null } | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: folders = [], isLoading: foldersLoading, isError: foldersError } = useListNoteFolders();
  const { data: notes = [], isLoading: notesLoading, isError: notesError } = useListNotes(
    { folderId: folderId ?? undefined, q: search || undefined },
    { query: { enabled: true } as any },
  );
  const createNote = useCreateNote();
  const deleteFolder = useDeleteNoteFolder();

  const subjects = folders.filter((folder) => folder.parentId == null);
  const childFolders = folders.filter((folder) => folder.parentId != null);
  const visibleNotes = useMemo(() => [...notes].sort((a, b) =>
    sort === "title" ? a.title.localeCompare(b.title) : +new Date(b.updatedAt) - +new Date(a.updatedAt),
  ), [notes, sort]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getListNoteFoldersQueryKey() });
    qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId ?? undefined, q: search || undefined }) });
  };

  const createNewNote = () => {
    createNote.mutate({ data: { title: "Untitled note", folderId: folderId ?? undefined, contentMarkdown: "" } }, {
      onSuccess: (note) => {
        refresh();
        setLocation(`/notes?id=${note.id}`);
        toast({ title: "Note created" });
      },
      onError: (error) => toast({ title: "Could not create note", description: message(error, "Please try again."), variant: "destructive" }),
    });
  };

  const removeFolder = () => {
    if (!folderToDelete) return;
    deleteFolder.mutate({ id: folderToDelete.id }, {
      onSuccess: () => {
        if (folderId === folderToDelete.id || folderToDelete.parentId === null) setFolderId(null);
        setFolderToDelete(null);
        setLocation("/notes");
        refresh();
        toast({ title: "Folder deleted" });
      },
      onError: (error) => toast({ title: "Could not delete folder", description: message(error, "Please try again."), variant: "destructive" }),
    });
  };

  return <div className="flex h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-in fade-in zoom-in-95 duration-300">
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-secondary/20 md:flex">
      <div className="flex items-center justify-between border-b border-border bg-card p-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subjects</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFolderDialog({ parentId: null })} title="New subject"><Plus className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <button onClick={() => setFolderId(null)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm", folderId === null ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary")}> <FileText className="h-4 w-4" /> All notes </button>
          {foldersLoading && <p className="p-2 text-xs text-muted-foreground">Loading subjects…</p>}
          {foldersError && <p className="p-2 text-xs text-destructive">Could not load subjects.</p>}
          {subjects.map((subject) => <div key={subject.id} className="group">
            <div className={cn("flex items-center rounded-md", folderId === subject.id && "bg-secondary")}>
              <button onClick={() => setFolderId(subject.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm font-semibold hover:text-primary"><Folder className="h-4 w-4 text-primary" /><span className="truncate">{subject.name}</span></button>
              <FolderActions folder={subject} onAddFolder={() => setFolderDialog({ parentId: subject.id })} onEdit={() => setFolderDialog({ folder: subject, parentId: null })} onDelete={() => setFolderToDelete(subject)} />
            </div>
            <div className="ml-3 border-l border-border pl-2">
              {childFolders.filter((folder) => folder.parentId === subject.id).map((folder) => <div key={folder.id} className={cn("flex items-center rounded-md", folderId === folder.id && "bg-primary/10 text-primary")}>
                <button onClick={() => setFolderId(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm hover:text-primary"><ChevronDown className="h-3 w-3 -rotate-90" /><span className="truncate">{folder.name}</span></button>
                <FolderActions folder={folder} onEdit={() => setFolderDialog({ folder, parentId: folder.parentId ?? null })} onDelete={() => setFolderToDelete(folder)} />
              </div>)}
            </div>
          </div>)}
          {!foldersLoading && subjects.length === 0 && <p className="p-2 text-xs text-muted-foreground">Create a subject to organize your notes.</p>}
        </div>
      </ScrollArea>
    </aside>

    <section className={cn("flex w-full shrink-0 flex-col border-r border-border bg-card md:w-80", activeNoteId && "hidden md:flex")}>
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</span><Button size="sm" className="h-7 gap-1 px-2 text-xs" disabled={createNote.isPending} onClick={createNewNote}><Plus className="h-3 w-3" /> New</Button></div>
        <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 pl-7 text-xs" placeholder="Search notes" /></div><Select value={sort} onValueChange={(value) => setSort(value as "updated" | "title")}><SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updated">Recent</SelectItem><SelectItem value="title">Title</SelectItem></SelectContent></Select></div>
      </div>
      <ScrollArea className="flex-1"><div className="divide-y divide-border">
        {notesLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading notes…</p>}
        {notesError && <p className="p-6 text-center text-sm text-destructive">Could not load notes.</p>}
        {!notesLoading && !notesError && visibleNotes.map((note) => <button key={note.id} onClick={() => setLocation(`/notes?id=${note.id}`)} className={cn("flex w-full flex-col gap-1 border-l-4 p-4 text-left transition-colors", activeNoteId === note.id ? "border-l-primary bg-secondary/80" : "border-l-transparent hover:bg-secondary/40")}><div className="flex w-full items-center gap-2">{note.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}<span className="flex-1 truncate text-sm font-semibold">{note.title}</span></div><span className="truncate text-xs text-muted-foreground">{note.contentMarkdown || "Empty note"}</span></button>)}
        {!notesLoading && !notesError && visibleNotes.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No notes match this view.</p>}
      </div></ScrollArea>
    </section>

    <main className={cn("min-w-0 flex-1 bg-background", !activeNoteId ? "hidden md:block" : "block")}>
      {activeNoteId ? <NoteEditor key={activeNoteId} noteId={activeNoteId} folderId={folderId} folders={childFolders} onClose={() => setLocation("/notes")} /> : <div className="flex h-full flex-col items-center justify-center text-muted-foreground"><FileText className="mb-4 h-12 w-12 opacity-20" /><p className="font-mono text-sm font-bold uppercase tracking-widest">Select or create a note</p></div>}
    </main>
    <FolderDialog state={folderDialog} folders={folders} onOpenChange={(open) => !open && setFolderDialog(null)} onSaved={() => { setFolderDialog(null); refresh(); }} />
    <ConfirmDialog open={!!folderToDelete} title={`Delete ${folderToDelete?.parentId == null ? "subject" : "folder"}?`} description="Its notes and any nested folders will be permanently deleted." pending={deleteFolder.isPending} onCancel={() => setFolderToDelete(null)} onConfirm={removeFolder} />
  </div>;
}

function FolderActions({ folder, onAddFolder, onEdit, onDelete }: { folder: NoteFolder; onAddFolder?: () => void; onEdit: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="mr-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{onAddFolder && <DropdownMenuItem onClick={onAddFolder}><FolderPlus className="mr-2 h-4 w-4" />New folder</DropdownMenuItem>}<DropdownMenuItem onClick={onEdit}>Rename</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function FolderDialog({ state, folders, onOpenChange, onSaved }: { state: { folder?: NoteFolder; parentId: number | null } | null; folders: NoteFolder[]; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [name, setName] = useState(""); const [parentId, setParentId] = useState<string>(ALL_FOLDERS); const { toast } = useToast();
  const create = useCreateNoteFolder(); const update = useUpdateNoteFolder();
  useEffect(() => { if (state) { setName(state.folder?.name ?? ""); setParentId(state.folder?.parentId?.toString() ?? state.parentId?.toString() ?? ALL_FOLDERS); } }, [state]);
  const save = () => { if (!state || !name.trim()) return; const parent = parentId === ALL_FOLDERS ? null : Number(parentId); const done = () => { toast({ title: state.folder ? "Folder renamed" : parent ? "Folder created" : "Subject created" }); onSaved(); }; const fail = (error: unknown) => toast({ title: "Could not save folder", description: message(error, "Please try again."), variant: "destructive" }); if (state.folder) update.mutate({ id: state.folder.id, data: { name: name.trim(), parentId: parent } }, { onSuccess: done, onError: fail }); else create.mutate({ data: { name: name.trim(), ...(parent ? { parentId: parent } : {}) } }, { onSuccess: done, onError: fail }); };
  const isChild = parentId !== ALL_FOLDERS;
  return <Dialog open={!!state} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{state?.folder ? "Edit folder" : state?.parentId ? "New folder" : "New subject"}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div><Label>Name</Label><Input autoFocus className="mt-1" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && save()} /></div>{!state?.parentId && <div><Label>Subject</Label><Select value={parentId} onValueChange={setParentId}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL_FOLDERS}>This is a subject</SelectItem>{folders.filter((folder) => folder.parentId == null && folder.id !== state?.folder?.id).map((subject) => <SelectItem value={String(subject.id)} key={subject.id}>{subject.name}</SelectItem>)}</SelectContent></Select></div>}{isChild && <p className="text-xs text-muted-foreground">This folder will appear under its selected subject.</p>}</div><DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim() || create.isPending || update.isPending} onClick={save}>Save</Button></DialogFooter></DialogContent></Dialog>;
}

function NoteEditor({ noteId, folderId, folders, onClose }: { noteId: number; folderId: number | null; folders: NoteFolder[]; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient(); const { toast } = useToast(); const { data: note, isLoading, isError } = useGetNote(noteId); const update = useUpdateNote(); const remove = useDeleteNote();
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [saveState, setSaveState] = useState<"saved" | "edited" | "saving">("saved"); const [deleteOpen, setDeleteOpen] = useState(false); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (note) { setTitle(note.title); setContent(note.contentMarkdown ?? ""); setSaveState("saved"); } }, [note]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const refresh = () => { qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId ?? undefined }) }); qc.invalidateQueries({ queryKey: getGetNoteQueryKey(noteId) }); };
  const schedule = (nextTitle: string, nextContent: string) => { setTitle(nextTitle); setContent(nextContent); setSaveState("edited"); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { setSaveState("saving"); update.mutate({ id: noteId, data: { title: nextTitle.trim() || "Untitled note", contentMarkdown: nextContent } }, { onSuccess: (saved) => { qc.setQueryData(getGetNoteQueryKey(noteId), saved); refresh(); setSaveState("saved"); }, onError: (error) => { setSaveState("edited"); toast({ title: "Autosave failed", description: message(error, "Your changes are still in the editor."), variant: "destructive" }); } }); }, 700); };
  const move = (value: string) => update.mutate({ id: noteId, data: { folderId: value === ALL_FOLDERS ? null : Number(value) } }, { onSuccess: () => { refresh(); toast({ title: "Note moved" }); }, onError: (error) => toast({ title: "Could not move note", description: message(error, "Please try again."), variant: "destructive" }) });
  const create = useCreateNote();
  const duplicateNote = () => { if (!note) return; const payload = { title: `${note.title} copy`, contentMarkdown: note.contentMarkdown, folderId: note.folderId ?? undefined, tags: note.tags }; create.mutate({ data: payload }, { onSuccess: (copy) => { refresh(); toast({ title: "Note duplicated" }); setLocation(`/notes?id=${copy.id}`); }, onError: (error) => toast({ title: "Could not duplicate note", description: message(error, "Please try again."), variant: "destructive" }) }); };
  const deleteNote = () => remove.mutate({ id: noteId }, { onSuccess: () => { refresh(); toast({ title: "Note deleted" }); onClose(); }, onError: (error) => toast({ title: "Could not delete note", description: message(error, "Please try again."), variant: "destructive" }) });
  if (isLoading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading note…</div>; if (isError || !note) return <div className="flex h-full items-center justify-center text-destructive">Could not load this note.</div>;
  return <div className="flex h-full flex-col"><header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4"><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onClose}><X className="h-4 w-4" /></Button><span className={cn("rounded border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest", saveState === "saved" ? "border-green-500/20 bg-green-500/10 text-green-600" : saveState === "saving" ? "border-blue-500/20 bg-blue-500/10 text-blue-600" : "border-orange-500/20 bg-orange-500/10 text-orange-600")}>{saveState}</span><span className="hidden text-xs text-muted-foreground lg:inline">Markdown is supported</span></div><div className="flex items-center gap-1"><Select value={note.folderId?.toString() ?? ALL_FOLDERS} onValueChange={move}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Move to…" /></SelectTrigger><SelectContent><SelectItem value={ALL_FOLDERS}>No folder</SelectItem>{folders.map((folder) => <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>)}</SelectContent></Select><Button variant="ghost" size="sm" className="h-8" onClick={duplicateNote} disabled={create.isPending}>Duplicate</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => update.mutate({ id: noteId, data: { pinned: !note.pinned } }, { onSuccess: refresh })}><Pin className={cn("h-4 w-4", note.pinned && "fill-primary text-primary")} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /></Button></div></header><div className="flex min-h-0 flex-1 flex-col"><div className="px-8 pb-4 pt-8"><Input value={title} onChange={(event) => schedule(event.target.value, content)} className="h-auto rounded-none border-0 bg-transparent px-0 text-3xl font-extrabold shadow-none focus-visible:ring-0" placeholder="Note title" /></div><ScrollArea className="flex-1 px-8 pb-8"><Textarea value={content} onChange={(event) => schedule(title, event.target.value)} className="min-h-[500px] resize-none border-0 bg-transparent px-0 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0" placeholder="Start typing Markdown…" /></ScrollArea></div><ConfirmDialog open={deleteOpen} title="Delete note?" description="This permanently deletes the note and its version history." pending={remove.isPending} onCancel={() => setDeleteOpen(false)} onConfirm={deleteNote} /></div>;
}

function ConfirmDialog({ open, title, description, pending, onCancel, onConfirm }: { open: boolean; title: string; description: string; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(value) => !value && onCancel()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{description}</p><DialogFooter><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent></Dialog>;
}
