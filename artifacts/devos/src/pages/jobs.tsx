import { useListJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@workspace/api-client-react";
import { Target, Plus, Building2, MapPin, DollarSign, Calendar, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListJobsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STAGES = [
  { id: 'wishlist', label: 'Wishlist', color: 'border-muted-foreground/30 text-muted-foreground bg-secondary/50' },
  { id: 'applied', label: 'Applied', color: 'border-blue-500/30 text-blue-600 bg-blue-500/10' },
  { id: 'assessment', label: 'Assessment', color: 'border-purple-500/30 text-purple-600 bg-purple-500/10' },
  { id: 'interview', label: 'Interviewing', color: 'border-orange-500/30 text-orange-600 bg-orange-500/10' },
  { id: 'offer', label: 'Offer', color: 'border-green-500/30 text-green-600 bg-green-500/10' },
  { id: 'rejected', label: 'Rejected', color: 'border-red-500/30 text-red-600 bg-red-500/10' }
];

// Map API exact statuses to our board stages
const mapStatusToStage = (status: JobStatus) => {
  if (['oa', 'phone', 'technical', 'hr', 'final'].includes(status)) return 'interview';
  return status;
};

export default function JobsPage() {
  const { data: jobs, isLoading } = useListJobs();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Job Board
          </h1>
          <p className="text-muted-foreground mt-2">Track applications and interview pipelines.</p>
        </div>
        <AddJobDialog />
      </div>

      <div className="flex-1 overflow-x-auto min-h-0 pb-4">
        <div className="flex gap-6 h-full min-w-max px-1">
          {STAGES.map(stage => {
            const stageJobs = jobs?.filter(j => mapStatusToStage(j.status) === stage.id) || [];
            return (
              <div key={stage.id} className="w-80 flex flex-col bg-card/50 rounded-xl border border-border/50">
                <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-xl shadow-sm">
                  <Badge variant="outline" className={cn("uppercase tracking-widest text-[10px]", stage.color)}>
                    {stage.label}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm">{stageJobs.length}</span>
                </div>
                
                <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                  {stageJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  {stageJobs.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground opacity-50">
                      Drag here (TODO)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const qc = useQueryClient();
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();

  const handleStatusChange = (newStatus: JobStatus) => {
    updateJob.mutate({ id: job.id, data: { status: newStatus } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListJobsQueryKey() })
    });
  };

  const handleDelete = () => {
    if(confirm("Delete job entry?")) {
      deleteJob.mutate({ id: job.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListJobsQueryKey() })
      });
    }
  };

  return (
    <div className="bg-background border border-border p-4 rounded-lg shadow-sm hover-elevate transition-all group">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0">
          <h4 className="font-bold text-base truncate">{job.role}</h4>
          <p className="text-sm text-primary font-semibold flex items-center gap-1 mt-0.5 truncate">
            <Building2 className="h-3.5 w-3.5" /> {job.company}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
             <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">Move To</div>
             {Object.values(JobStatus).map(s => (
               <DropdownMenuItem key={s} onClick={() => handleStatusChange(s as JobStatus)} className="text-xs capitalize">
                 {s.replace('_', ' ')}
               </DropdownMenuItem>
             ))}
             <div className="h-px bg-border my-1" />
             <DropdownMenuItem onClick={handleDelete} className="text-xs text-destructive focus:text-destructive">
               <Trash2 className="h-3 w-3 mr-2" /> Delete
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5 mt-4 text-xs text-muted-foreground font-medium">
        {job.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 opacity-70" /> {job.location}
          </div>
        )}
        {job.packageAmount && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 opacity-70 text-green-500" /> <span className="text-green-600 font-mono">{job.packageAmount}</span>
          </div>
        )}
      </div>
      
      {job.status === 'interview' && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold px-1.5 py-0">Pending Screen</Badge>
          <Button variant="link" size="sm" className="h-5 px-0 text-[10px] uppercase tracking-wider">Log Round</Button>
        </div>
      )}
    </div>
  );
}

function AddJobDialog() {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const qc = useQueryClient();
  const create = useCreateJob();

  const handleSave = () => {
    if(!company || !role) return;
    create.mutate({ data: { company, role, location, status: 'wishlist' } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setOpen(false);
        setCompany("");
        setRole("");
        setLocation("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Add Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Job Opportunity</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Company</Label>
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Stripe" className="mt-1" />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Frontend Engineer" className="mt-1" />
          </div>
          <div>
            <Label>Location / Type</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, NY" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!company || !role || create.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
