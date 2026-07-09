import { useListResumes, useCreateResume, useSetPrimaryResume } from "@workspace/api-client-react";
import { FileBadge, Plus, Star, ScanLine, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { getListResumesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ResumePage() {
  const { data: resumes } = useListResumes();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <FileBadge className="h-8 w-8 text-primary" />
            Resume Hub
          </h1>
          <p className="text-muted-foreground mt-2">Manage versions, parse content, and check ATS match scores.</p>
        </div>
        <AddResumeDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes?.map(resume => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
        {resumes?.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
             <FileBadge className="h-12 w-12 mx-auto mb-4 opacity-20" />
             <p className="font-bold text-lg mb-2 text-foreground">No Resumes Found</p>
             <p className="mb-6">Upload or paste your resume content to create versions tailored for different roles.</p>
             <AddResumeDialog />
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeCard({ resume }: { resume: any }) {
  const qc = useQueryClient();
  const setPrimary = useSetPrimaryResume();

  const handleSetPrimary = () => {
    setPrimary.mutate({ id: resume.id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListResumesQueryKey() })
    });
  };

  return (
    <Card className={cn(
      "border-border shadow-sm flex flex-col hover-elevate transition-all",
      resume.isPrimary ? "ring-2 ring-primary border-transparent" : ""
    )}>
      <CardHeader className="pb-3 bg-secondary/30 border-b border-border">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{resume.versionName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 font-mono">ID: RES-{resume.id.toString().padStart(4, '0')}</p>
          </div>
          {resume.isPrimary ? (
            <Badge className="bg-primary text-primary-foreground font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">Primary</Badge>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleSetPrimary} className="text-xs h-7">Set Primary</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
           <span className="text-sm font-bold flex items-center gap-2">
             <ScanLine className="h-4 w-4 text-blue-500" /> ATS Score
           </span>
           <span className="font-mono font-black text-xl text-blue-600">{resume.atsScore || '--'}</span>
        </div>
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Detected Skills</span>
          <div className="flex flex-wrap gap-1.5 h-16 overflow-hidden">
            {resume.skills?.slice(0, 10).map((s: string) => (
              <Badge key={s} variant="outline" className="bg-secondary text-[10px] py-0">{s}</Badge>
            ))}
            {(!resume.skills || resume.skills.length === 0) && (
              <span className="text-xs text-muted-foreground italic">No skills extracted yet.</span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1 bg-background" disabled>
            <FileText className="h-4 w-4 mr-2" /> Edit Text
          </Button>
          <Button variant="secondary" className="flex-1 text-primary bg-primary/10 border border-primary/20" disabled>
            <Star className="h-4 w-4 mr-2" /> Analyze Role
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddResumeDialog() {
  const [open, setOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const qc = useQueryClient();
  const create = useCreateResume();

  const handleSave = () => {
    if(!versionName) return;
    create.mutate({ data: { versionName, contentText: "", skills: [] } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        setOpen(false);
        setVersionName("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> New Version
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Resume Version</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label>Version Name</Label>
          <Input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="e.g. Frontend React 2024" className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!versionName || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
