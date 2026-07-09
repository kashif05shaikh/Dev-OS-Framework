import { useListLearningFolders, useListSubjects, useListTopics, useCreateSubject, useUpdateSubject, useDeleteSubject, useCreateTopic, useUpdateTopic, useDeleteTopic, useCreateLearningFolder } from "@workspace/api-client-react";
import { Folder, PlayCircle, FileText, Globe, Github, Plus, MoreVertical, Edit2, Trash2, LayoutGrid, List as ListIcon, CheckCircle2, Clock } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { TopicType, TopicPriority } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSubjectsQueryKey, getListTopicsQueryKey, getListLearningFoldersQueryKey } from "@workspace/api-client-react";

export default function LearningPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  
  const { data: subjects, isLoading: loadingSubjects } = useListSubjects();
  const { data: folders } = useListLearningFolders({ subjectId: selectedSubjectId || undefined }, { query: { enabled: !!selectedSubjectId } as any });
  const { data: topics, isLoading: loadingTopics } = useListTopics({ subjectId: selectedSubjectId || undefined, folderId: selectedFolderId || undefined }, { query: { enabled: !!selectedSubjectId } as any });

  // Default to first subject if none selected
  useMemo(() => {
    if (subjects && subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Learning Hub</h1>
          <p className="text-muted-foreground mt-1">Organize courses, documentation, and videos.</p>
        </div>
        <div className="flex gap-2">
           <SubjectDialog />
           {selectedSubjectId && <TopicDialog subjectId={selectedSubjectId} folderId={selectedFolderId || undefined} />}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Sidebar: Subjects & Folders */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col gap-1 h-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 py-2 mb-1">Subjects</h3>
            
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 pr-3">
                {subjects?.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubjectId(subject.id); setSelectedFolderId(null); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all text-left",
                      selectedSubjectId === subject.id 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "hover:bg-secondary text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-lg">{subject.icon}</span>
                      <span className="truncate">{subject.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedSubjectId && folders && folders.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 pb-2 mb-1">Folders</h3>
                  <div className="flex flex-col gap-1 pr-3">
                     <button
                        onClick={() => setSelectedFolderId(null)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-left",
                          selectedFolderId === null ? "bg-secondary text-foreground font-bold" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                      >
                        <Folder className="h-3 w-3" />
                        All Topics
                      </button>
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-left",
                          selectedFolderId === folder.id ? "bg-secondary text-foreground font-bold" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                      >
                        <Folder className="h-3 w-3" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {selectedSubjectId && <FolderDialog subjectId={selectedSubjectId} />}
          </div>
        </div>

        {/* Main: Topics */}
        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
          {!selectedSubjectId ? (
             <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a subject to view topics</div>
          ) : (
             <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topics?.map(topic => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                  {topics?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <p>No topics found. Add a course, video, or article to start learning.</p>
                    </div>
                  )}
                </div>
             </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: any }) {
  const qc = useQueryClient();
  const updateTopic = useUpdateTopic();
  
  const handleToggleComplete = () => {
    updateTopic.mutate({ 
      id: topic.id, 
      data: { completed: !topic.completed, progressPercent: !topic.completed ? 100 : topic.progressPercent } 
    }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId: topic.subjectId })})
    });
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('youtube')) return <PlayCircle className="h-4 w-4 text-red-500" />;
    if (type.includes('github')) return <Github className="h-4 w-4" />;
    if (type.includes('article') || type.includes('doc')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <Globe className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className={cn(
      "border border-border rounded-lg p-4 bg-background flex flex-col gap-3 transition-all hover:border-primary/40 hover:shadow-md",
      topic.completed ? "opacity-70 grayscale-[0.5]" : ""
    )}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 bg-secondary p-1.5 rounded flex-shrink-0">
             {getTypeIcon(topic.type)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm leading-tight line-clamp-2" title={topic.title}>{topic.title}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{topic.type.replace('_', ' ')}</p>
          </div>
        </div>
        <TopicActionsMenu topic={topic} />
      </div>

      <div className="mt-auto pt-2 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{topic.progressPercent}%</span>
          {topic.durationSeconds ? <span>{Math.round(topic.durationSeconds / 60)}m</span> : <span>--:--</span>}
        </div>
        <Progress value={topic.progressPercent} className="h-1.5" />
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <Badge variant="outline" className={cn(
            "text-[10px] px-1.5 py-0 rounded uppercase tracking-wider",
            topic.priority === 'high' ? "border-red-500/50 text-red-500" :
            topic.priority === 'medium' ? "border-orange-500/50 text-orange-500" :
            "border-border text-muted-foreground"
          )}>
            {topic.priority}
          </Badge>

          <button 
            onClick={handleToggleComplete}
            className={cn(
              "text-xs font-bold flex items-center gap-1 transition-colors rounded px-2 py-1",
              topic.completed ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {topic.completed ? "Done" : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicActionsMenu({ topic }: { topic: any }) {
  const qc = useQueryClient();
  const deleteTopic = useDeleteTopic();
  
  const handleDelete = () => {
    if(confirm("Delete topic?")) {
      deleteTopic.mutate({ id: topic.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId: topic.subjectId })})
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 flex-shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={() => window.open(topic.url, '_blank')} className="text-xs">
          Open Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-xs text-destructive focus:text-destructive">
          <Trash2 className="h-3 w-3 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📚");
  const qc = useQueryClient();
  const createSub = useCreateSubject();

  const handleSave = () => {
    if(!name) return;
    createSub.mutate({ data: { name, icon, color: "#3b82f6" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-bold gap-1 border-primary/50 text-primary hover:bg-primary/10">
          <Plus className="h-4 w-4" /> Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Subject</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <div className="w-16">
              <Label>Icon</Label>
              <Input value={icon} onChange={e => setIcon(e.target.value)} className="mt-1" />
            </div>
            <div className="flex-1">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. System Design" className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || createSub.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderDialog({ subjectId }: { subjectId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const createFolder = useCreateLearningFolder();

  const handleSave = () => {
    if(!name) return;
    createFolder.mutate({ data: { subjectId, name } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListLearningFoldersQueryKey({ subjectId }) });
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs mt-2 text-muted-foreground hover:text-foreground">
          <Plus className="h-3 w-3 mr-2" /> New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Distributed Systems" className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || createFolder.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TopicDialog({ subjectId, folderId }: { subjectId: number, folderId?: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<TopicType>('youtube_video');
  const qc = useQueryClient();
  const createTopic = useCreateTopic();

  const handleSave = () => {
    if(!title) return;
    createTopic.mutate({ data: { subjectId, folderId, title, url, type, priority: 'medium' } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId, folderId }) });
        setOpen(false);
        setTitle("");
        setUrl("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-bold gap-1 shadow-sm">
          <Plus className="h-4 w-4" /> Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. MIT 6.824 Lecture 1" className="mt-1" />
          </div>
          <div>
            <Label>URL (Optional)</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TopicType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(TopicType).map(t => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title || createTopic.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
