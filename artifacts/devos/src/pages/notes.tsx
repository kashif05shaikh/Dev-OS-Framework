import { useState, useRef, useEffect, useCallback } from "react";
import { useListNotes, useListNoteFolders, useGetNote, useCreateNote, useUpdateNote, useCreateNoteFolder, useDeleteNote } from "@workspace/api-client-react";
import { Folder, FileText, Plus, Pin, Archive, Trash2, Edit3, Save, MoreVertical, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotesQueryKey, getListNoteFoldersQueryKey, getGetNoteQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export default function NotesPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const activeNoteId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const [folderId, setFolderId] = useState<number | null>(null);

  const { data: folders } = useListNoteFolders();
  const { data: notes } = useListNotes({ folderId: folderId || undefined }, { query: { enabled: true } as any });
  
  const qc = useQueryClient();
  const createNote = useCreateNote();
  const createFolder = useCreateNoteFolder();
  const deleteNote = useDeleteNote();

  const handleCreateNote = () => {
    createNote.mutate({ data: { title: "Untitled Note", folderId: folderId || undefined, contentMarkdown: "" } }, {
      onSuccess: (n) => {
        qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId || undefined }) });
        setLocation(`/notes?id=${n.id}`);
      }
    });
  };

  const handleCreateFolder = () => {
    const name = prompt("Folder name:");
    if (name) {
      createFolder.mutate({ data: { name } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListNoteFoldersQueryKey() })
      });
    }
  };

  return (
    <div className="flex h-full border border-border bg-card rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Left Sidebar: Folders */}
      <div className="w-48 border-r border-border bg-secondary/20 flex flex-col hidden md:flex flex-shrink-0">
        <div className="p-3 border-b border-border flex justify-between items-center bg-card">
          <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Notebooks</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateFolder}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-1">
            <button 
              onClick={() => setFolderId(null)}
              className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left", folderId === null ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "hover:bg-secondary text-foreground")}
            >
              <FileText className="h-3.5 w-3.5" /> All Notes
            </button>
            {folders?.map(f => (
              <button 
                key={f.id}
                onClick={() => setFolderId(f.id)}
                className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left", folderId === f.id ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "hover:bg-secondary text-foreground")}
              >
                <Folder className="h-3.5 w-3.5" /> <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Middle Sidebar: Note List */}
      <div className={cn("w-full md:w-72 border-r border-border bg-card flex flex-col flex-shrink-0", activeNoteId ? "hidden md:flex" : "flex")}>
        <div className="p-3 border-b border-border flex justify-between items-center">
           <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Notes</span>
           <Button size="sm" className="h-7 text-xs font-bold px-2 gap-1 shadow-sm" onClick={handleCreateNote}>
             <Plus className="h-3 w-3" /> New
           </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {notes?.map(n => (
              <button
                key={n.id}
                onClick={() => setLocation(`/notes?id=${n.id}`)}
                className={cn(
                  "w-full text-left p-4 transition-colors flex flex-col gap-1",
                  activeNoteId === n.id ? "bg-secondary/80 border-l-4 border-l-primary" : "hover:bg-secondary/40 border-l-4 border-l-transparent"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  {n.pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                  <span className="font-semibold text-sm truncate flex-1 leading-none">{n.title || "Untitled"}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate opacity-80">{n.contentMarkdown?.substring(0, 50) || "Empty note"}</span>
              </button>
            ))}
            {notes?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                No notes found.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Area: Editor */}
      <div className={cn("flex-1 bg-background flex flex-col min-w-0 relative", !activeNoteId ? "hidden md:flex" : "flex")}>
        {activeNoteId ? (
          <NoteEditor noteId={activeNoteId} folderId={folderId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest font-bold">Select or create a note</p>
          </div>
        )}
      </div>

    </div>
  );
}

function NoteEditor({ noteId, folderId }: { noteId: number, folderId: number | null }) {
  const [, setLocation] = useLocation();
  const { data: note, isLoading } = useGetNote(noteId, { query: { enabled: !!noteId } as any });
  const updateNote = useUpdateNote();
  const qc = useQueryClient();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const initializedForId = useRef<number | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved"|"saving"|"edited">("saved");

  // Init
  useEffect(() => {
    if (note && initializedForId.current !== noteId) {
      initializedForId.current = noteId;
      setTitle(note.title);
      setContent(note.contentMarkdown || "");
      setSaveStatus("saved");
    }
  }, [note, noteId]);

  // Handle changes & auto-save
  const handleChange = (newTitle: string, newContent: string) => {
    setTitle(newTitle);
    setContent(newContent);
    setSaveStatus("edited");
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      updateNote.mutate({ id: noteId, data: { title: newTitle, contentMarkdown: newContent } }, {
        onSuccess: (updated) => {
          setSaveStatus("saved");
          // Patch cache directly to avoid refetch loop
          qc.setQueryData(getGetNoteQueryKey(noteId), updated);
          qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId || undefined }) });
        }
      });
    }, 1000);
  };

  const handleTogglePin = () => {
    if (!note) return;
    updateNote.mutate({ id: noteId, data: { pinned: !note.pinned } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId || undefined }) })
    });
  };

  const handleDelete = () => {
    if(confirm("Delete note?")) {
      deleteNote.mutate({ id: noteId }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListNotesQueryKey({ folderId: folderId || undefined }) });
          setLocation("/notes");
        }
      });
    }
  };

  if (isLoading || initializedForId.current !== noteId) return <div className="flex-1 flex items-center justify-center"><FileText className="animate-pulse opacity-20 h-10 w-10"/></div>;

  return (
    <>
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setLocation("/notes")}>
            <X className="h-4 w-4" />
          </Button>
          <span className={cn(
            "text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-1 rounded-sm border",
            saveStatus === 'saved' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
            saveStatus === 'saving' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : 
            "bg-orange-500/10 text-orange-600 border-orange-500/20"
          )}>
            {saveStatus}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={handleTogglePin}>
            <Pin className={cn("h-4 w-4", note?.pinned ? "fill-primary text-primary" : "")} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-4 flex-shrink-0">
          <Input 
            value={title}
            onChange={(e) => handleChange(e.target.value, content)}
            className="text-3xl font-extrabold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent rounded-none"
            placeholder="Note Title"
          />
        </div>
        <ScrollArea className="flex-1 px-8 pb-8">
          <Textarea 
            value={content}
            onChange={(e) => handleChange(title, e.target.value)}
            className="min-h-[500px] border-none shadow-none focus-visible:ring-0 px-0 resize-none font-mono text-sm leading-relaxed bg-transparent"
            placeholder="Start typing markdown here..."
          />
        </ScrollArea>
      </div>
    </>
  );
}
