import { useListCodingProfiles, useCreateCodingProfile, useDeleteCodingProfile, useSyncCodingProfile } from "@workspace/api-client-react";
import { Code2, RefreshCw, Plus, Trash2, ExternalLink, ShieldAlert, Award, TrendingUp, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CodingPlatform } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListCodingProfilesQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CodingPage() {
  const { data: profiles, isLoading } = useListCodingProfiles();
  const qc = useQueryClient();

  const totalSolved = profiles?.reduce((sum, p) => sum + (p.solvedCount || 0), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Code2 className="h-8 w-8 text-primary" />
            Coding Profiles
          </h1>
          <p className="text-muted-foreground mt-2">Track your problem solving and open source footprint.</p>
        </div>
        <AddProfileDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono">{totalSolved}</div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono">{profiles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground shadow-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary-foreground/80 uppercase tracking-wider font-bold">DevOS Ranking</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-black flex items-center gap-2">
               <ShieldAlert className="h-8 w-8" />
               Vanguard
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles?.map(p => (
          <ProfileCard key={p.id} profile={p} />
        ))}
        {profiles?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
             <p className="mb-4">No coding profiles connected.</p>
             <AddProfileDialog />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const deleteProfile = useDeleteProfile(profile.id);
  const syncProfile = useSyncProfile(profile.id);

  const isLiveSync = ['github', 'leetcode', 'codeforces', 'atcoder'].includes(profile.platform);

  return (
    <Card className="overflow-hidden bg-card border-border shadow-sm flex flex-col hover-elevate transition-all">
      <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="font-bold text-xs uppercase bg-primary/20 text-primary">{profile.platform.substring(0,2)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg leading-none capitalize">{profile.platform}</h3>
            <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 font-mono">
              @{profile.usernameOrHandle} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
           <Badge variant="outline" className={cn(
             "text-[9px] px-1.5 py-0 uppercase tracking-widest rounded-sm",
             profile.syncStatus === 'ok' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
             profile.syncStatus === 'unsupported' ? "bg-secondary text-muted-foreground border-border" :
             "bg-red-500/10 text-red-600 border-red-500/20"
           )}>
             {profile.syncStatus}
           </Badge>
           <div className="flex items-center gap-1">
             {isLiveSync && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={syncProfile.sync} disabled={syncProfile.isPending}>
                  <RefreshCw className={cn("h-3 w-3", syncProfile.isPending && "animate-spin")} />
                </Button>
             )}
             <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={deleteProfile.remove}>
                <Trash2 className="h-3 w-3" />
             </Button>
           </div>
        </div>
      </div>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {!isLiveSync && profile.syncStatus === 'unsupported' ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-[url('/noise.png')] opacity-80">
            <p className="text-xs font-mono font-bold uppercase tracking-widest mb-1">Link Only</p>
            <p className="text-xs">Live stats sync not supported for {profile.platform} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-border flex-1">
            <div className="p-4 flex flex-col items-center justify-center text-center">
              <Award className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rating / Rank</p>
              <p className="text-xl font-black font-mono mt-1">{profile.rating || profile.rank || 'N/A'}</p>
            </div>
            <div className="p-4 flex flex-col items-center justify-center text-center">
              <Activity className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Solved</p>
              <p className="text-xl font-black font-mono mt-1">{profile.solvedCount || 0}</p>
            </div>
          </div>
        )}
      </CardContent>
      <div className="px-4 py-2 border-t border-border bg-secondary/10 text-[10px] text-muted-foreground font-mono uppercase text-center flex justify-between">
        <span>Updated</span>
        <span>{profile.lastSyncedAt ? format(parseISO(profile.lastSyncedAt), 'MMM d, HH:mm') : 'Never'}</span>
      </div>
    </Card>
  );
}

function useDeleteProfile(id: number) {
  const qc = useQueryClient();
  const mutation = useDeleteCodingProfile();
  return {
    remove: () => {
      if(confirm("Remove this profile?")) {
        mutation.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListCodingProfilesQueryKey() }) });
      }
    }
  };
}

function useSyncProfile(id: number) {
  const qc = useQueryClient();
  const mutation = useSyncCodingProfile();
  return {
    sync: () => mutation.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListCodingProfilesQueryKey() }) }),
    isPending: mutation.isPending
  };
}

function AddProfileDialog() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<CodingPlatform>('leetcode');
  const [username, setUsername] = useState("");
  const qc = useQueryClient();
  const create = useCreateCodingProfile();

  const handleSave = () => {
    if(!username) return;
    create.mutate({ data: { platform, usernameOrHandle: username } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCodingProfilesQueryKey() });
        setOpen(false);
        setUsername("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Connect Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Connect Coding Profile</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as CodingPlatform)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(CodingPlatform).map(p => (
                  <SelectItem key={p} value={p} className="capitalize">{p.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Username / Handle</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. torvalds" className="mt-1 font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!username || create.isPending}>Add & Sync</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
