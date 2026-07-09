import { useListDevTools, useConnectDevTool, useDisconnectDevTool, useSyncDevTool } from "@workspace/api-client-react";
import { Wrench, CheckCircle2, XCircle, RefreshCw, Key, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { getListDevToolsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export default function DevToolsPage() {
  const { data: tools } = useListDevTools();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            Hosting & Cloud
          </h1>
          <p className="text-muted-foreground mt-2">Connect accounts to monitor deployments and infrastructure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools?.map(tool => (
          <ToolCard key={tool.service} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: any }) {
  const qc = useQueryClient();
  const disconnect = useDisconnectDevTool();
  const sync = useSyncDevTool();

  const handleDisconnect = () => {
    if(!tool.connectionId) return;
    if(confirm(`Disconnect ${tool.name}?`)) {
      disconnect.mutate({ id: tool.connectionId }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListDevToolsQueryKey() })
      });
    }
  };

  const handleSync = () => {
    if(!tool.connectionId) return;
    sync.mutate({ id: tool.connectionId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListDevToolsQueryKey() })
    });
  };

  const isLiveSync = ['vercel', 'netlify', 'render', 'docker_hub'].includes(tool.service);

  return (
    <Card className={cn(
      "border-border shadow-sm flex flex-col transition-all",
      tool.connected ? "bg-card ring-1 ring-primary/20" : "bg-secondary/20"
    )}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {tool.name}
              {tool.connected ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="mt-1">
               {isLiveSync ? "Full API Sync" : "Connection Only (API limited)"}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn(
            "uppercase tracking-widest text-[9px] px-1.5 py-0",
            tool.connected ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-background text-muted-foreground"
          )}>
            {tool.connected ? "Active" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end border-t border-border mt-auto">
         {tool.connected ? (
           <div className="pt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                <span className="block text-[9px] uppercase tracking-wider font-bold text-foreground">Last Sync</span>
                {tool.lastSyncedAt ? format(parseISO(tool.lastSyncedAt), 'MMM d, HH:mm') : '--'}
              </div>
              <div className="flex gap-2">
                {isLiveSync && (
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending} className="h-8 gap-2 bg-background">
                    <RefreshCw className={cn("h-3 w-3", sync.isPending && "animate-spin")} /> Sync
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-8 text-destructive border-border hover:bg-destructive/10">
                  Disconnect
                </Button>
              </div>
           </div>
         ) : (
           <div className="pt-4">
             <ConnectDialog tool={tool} />
           </div>
         )}
      </CardContent>
    </Card>
  );
}

function ConnectDialog({ tool }: { tool: any }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const qc = useQueryClient();
  const connect = useConnectDevTool();

  const handleSave = () => {
    if(!token) return;
    connect.mutate({ data: { service: tool.service, accessToken: token } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDevToolsQueryKey() });
        setOpen(false);
        setToken("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full font-bold shadow-sm" variant="secondary">
          <Key className="h-4 w-4 mr-2" /> Connect Access Token
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Connect {tool.name}</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex gap-3 text-orange-600 text-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <p>Generate a Personal Access Token (PAT) from your {tool.name} account settings. Tokens are stored securely and never returned by the API.</p>
          </div>
          <div>
            <Label>Access Token</Label>
            <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Secret token..." className="mt-1 font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!token || connect.isPending}>Authenticate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
