import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject, useListProjectTasks, useCreateProjectTask, useUpdateProjectTask, useDeleteProjectTask } from "@workspace/api-client-react";
import { Briefcase, Plus, Github, ExternalLink, Calendar, CheckSquare, Trash2, Edit2, Play, Pause, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectStatus, ProjectPriority, ProjectTaskStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListProjectsQueryKey, getListProjectTasksQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useListProjects();
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const activeProject = projects?.find(p => p.id === activeProjectId);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Project Portfolio
          </h1>
          <p className="text-muted-foreground mt-2">Manage side projects from idea to deployment.</p>
        </div>
        <AddProjectDialog />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* Project List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-8">
           {projects?.map(p => (
             <div 
               key={p.id} 
               onClick={() => setActiveProjectId(p.id)}
               className={cn(
                 "p-5 rounded-xl border transition-all cursor-pointer",
                 activeProjectId === p.id 
                  ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/20" 
                  : "bg-background border-border hover:border-primary/30 hover:bg-card shadow-sm"
               )}
             >
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg leading-tight truncate">{p.name}</h3>
                 <Badge variant="outline" className={cn(
                    "text-[10px] uppercase tracking-widest px-1.5 py-0",
                    p.status === 'in_progress' ? "border-primary text-primary" : 
                    p.status === 'completed' ? "border-green-500 text-green-500" : "border-border text-muted-foreground"
                 )}>{p.status.replace('_', ' ')}</Badge>
               </div>
               <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{p.description || "No description provided."}</p>
               
               <div className="flex items-center gap-3 mt-auto">
                  <Progress value={p.progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs font-mono font-bold">{p.progressPercent}%</span>
               </div>
             </div>
           ))}
           {projects?.length === 0 && (
             <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
               No projects yet. Build something!
             </div>
           )}
        </div>

        {/* Project Details */}
        <div className="w-full lg:w-2/3 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {activeProject ? (
            <ProjectDetail project={activeProject} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-[linear-gradient(45deg,#8080800a_25%,transparent_25%,transparent_75%,#8080800a_75%,#8080800a),linear-gradient(45deg,#8080800a_25%,transparent_25%,transparent_75%,#8080800a_75%,#8080800a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
              <Briefcase className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-mono text-sm uppercase tracking-widest font-bold">Select a project</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ProjectDetail({ project }: { project: any }) {
  const qc = useQueryClient();
  const deleteProject = useDeleteProject();
  
  const handleDelete = () => {
    if(confirm("Delete project completely?")) {
      deleteProject.mutate({ id: project.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListProjectsQueryKey() })
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-border bg-secondary/20">
        <div className="flex justify-between items-start mb-4">
           <div>
             <h2 className="text-3xl font-black tracking-tight mb-2">{project.name}</h2>
             <div className="flex flex-wrap gap-2 mb-4">
               {project.techStack?.map((t: string) => (
                 <Badge key={t} variant="secondary" className="bg-background font-mono text-xs">{t}</Badge>
               ))}
             </div>
           </div>
           <div className="flex gap-2">
             {project.githubUrl && (
               <a href={project.githubUrl} target="_blank" rel="noreferrer" className="p-2 bg-background border border-border rounded-md hover:bg-secondary transition-colors">
                 <Github className="h-4 w-4" />
               </a>
             )}
             {project.liveUrl && (
               <a href={project.liveUrl} target="_blank" rel="noreferrer" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                 <ExternalLink className="h-4 w-4" />
               </a>
             )}
             <Button variant="outline" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 border-border">
               <Trash2 className="h-4 w-4" />
             </Button>
           </div>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed">{project.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background border border-border rounded-lg shadow-sm">
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Frontend</p>
             <p className="text-sm font-semibold">{project.frontend || '--'}</p>
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Backend</p>
             <p className="text-sm font-semibold">{project.backend || '--'}</p>
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Database</p>
             <p className="text-sm font-semibold">{project.database || '--'}</p>
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Deployment</p>
             <p className="text-sm font-semibold">{project.deployment || '--'}</p>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg flex items-center gap-2">
             <CheckSquare className="h-5 w-5 text-primary" />
             Task Board
           </h3>
           <AddTaskDialog projectId={project.id} />
        </div>
        <TaskBoard projectId={project.id} />
      </div>
    </div>
  );
}

function TaskBoard({ projectId }: { projectId: number }) {
  const { data: tasks } = useListProjectTasks(projectId, { query: { enabled: !!projectId } as any });
  
  const todo = tasks?.filter(t => t.status === 'todo') || [];
  const inProgress = tasks?.filter(t => t.status === 'in_progress') || [];
  const done = tasks?.filter(t => t.status === 'done') || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-y-auto pb-4">
      <TaskColumn title="To Do" tasks={todo} status="todo" />
      <TaskColumn title="In Progress" tasks={inProgress} status="in_progress" />
      <TaskColumn title="Done" tasks={done} status="done" />
    </div>
  );
}

function TaskColumn({ title, tasks, status }: { title: string, tasks: any[], status: ProjectTaskStatus }) {
  const qc = useQueryClient();
  const updateTask = useUpdateProjectTask();

  const handleMove = (task: any, newStatus: ProjectTaskStatus) => {
    updateTask.mutate({ id: task.id, data: { status: newStatus } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListProjectTasksQueryKey(task.projectId) })
    });
  };

  return (
    <div className="bg-secondary/30 rounded-lg border border-border flex flex-col h-[500px]">
      <div className="p-3 border-b border-border font-bold text-sm uppercase tracking-wider flex justify-between items-center bg-secondary/50">
        {title}
        <span className="bg-background px-2 py-0.5 rounded text-xs font-mono border border-border">{tasks.length}</span>
      </div>
      <div className="p-2 flex flex-col gap-2 overflow-y-auto flex-1">
        {tasks.map(t => (
          <div key={t.id} className="bg-background border border-border p-3 rounded shadow-sm text-sm flex flex-col gap-3 group">
            <span className={cn("font-medium leading-snug", status === 'done' ? "line-through text-muted-foreground" : "")}>{t.title}</span>
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {status !== 'todo' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(t, 'todo')}><ListIcon className="h-3 w-3" /></Button>
              )}
              {status !== 'in_progress' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500" onClick={() => handleMove(t, 'in_progress')}><Play className="h-3 w-3" /></Button>
              )}
              {status !== 'done' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500" onClick={() => handleMove(t, 'done')}><CheckCircle2 className="h-3 w-3" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal stub for ListIcon since it's not imported at top
function ListIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> }

function AddProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const create = useCreateProject();

  const handleSave = () => {
    if(!name) return;
    create.mutate({ data: { name, status: 'planning', priority: 'medium', techStack: [] } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setOpen(false);
        setName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Initialize Project</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Project Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DevOS v2" className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const qc = useQueryClient();
  const create = useCreateProjectTask();

  const handleSave = () => {
    if(!title) return;
    create.mutate({ data: { projectId, title, status: 'todo' } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
        setOpen(false);
        setTitle("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="font-bold gap-1 shadow-sm">
          <Plus className="h-3 w-3" /> Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Task Description</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Implement auth..." className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title || create.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
