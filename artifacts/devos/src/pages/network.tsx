import { useListSocialLinks, useCreateSocialLink, useDeleteSocialLink } from "@workspace/api-client-react";
import { Globe, Plus, Trash2, ExternalLink, Link as LinkIcon, Users, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SocialPlatform } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSocialLinksQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export default function NetworkPage() {
  const { data: links } = useListSocialLinks();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Network
          </h1>
          <p className="text-muted-foreground mt-2">Manage your professional presence across the web.</p>
        </div>
        <AddLinkDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links?.map(link => (
          <SocialCard key={link.id} link={link} />
        ))}
        {links?.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <p className="mb-4">No social profiles added yet.</p>
            <AddLinkDialog />
          </div>
        )}
      </div>
    </div>
  );
}

function SocialCard({ link }: { link: any }) {
  const qc = useQueryClient();
  const deleteLink = useDeleteSocialLink();

  const handleDelete = () => {
    if(confirm("Remove profile link?")) {
      deleteLink.mutate({ id: link.id }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListSocialLinksQueryKey() })
      });
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm hover-elevate transition-all">
      <CardHeader className="pb-3 border-b border-border bg-secondary/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="capitalize text-lg font-bold flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" /> {link.platform.replace('_', ' ')}
            </CardTitle>
            <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1 font-mono">
              {link.handle ? `@${link.handle}` : link.url.replace(/^https?:\/\//, '')} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background text-[9px] uppercase tracking-widest px-1.5 py-0">Profile</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2" onClick={handleDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 divide-x divide-border">
        <div className="flex flex-col items-center justify-center text-center px-2">
          <Users className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Followers</span>
          <span className="text-xl font-black font-mono">{link.followers ?? '--'}</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center px-2">
          <FileText className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posts</span>
          <span className="text-xl font-black font-mono">{link.postCount ?? '--'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddLinkDialog() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>('linkedin');
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const qc = useQueryClient();
  const create = useCreateSocialLink();

  const handleSave = () => {
    if(!url) return;
    create.mutate({ data: { platform, handle: handle || undefined, url } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSocialLinksQueryKey() });
        setOpen(false);
        setHandle("");
        setUrl("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Add Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Social Profile</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(SocialPlatform).map(p => (
                  <SelectItem key={p} value={p} className="capitalize">{p.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Handle / Username (Optional)</Label>
            <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="e.g. linus_t" className="mt-1" />
          </div>
          <div>
            <Label>Full URL</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!url || create.isPending}>Add Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
