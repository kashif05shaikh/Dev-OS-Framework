import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Link2, Link2Off, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformLogo } from "@/components/platform-logo";
import {
  connectCses,
  disconnectPlatform,
  listCodingConnections,
} from "@/lib/coding-connections.functions";
import { describeError } from "@/lib/devos-queries";

/**
 * CSES exposes no OAuth or public API, so each user links their own account:
 * credentials go straight to cses.fi and only the resulting session is stored,
 * encrypted, server-side. Nothing sensitive is ever sent back to the browser.
 */
export function CsesConnect() {
  const qc = useQueryClient();
  const list = useServerFn(listCodingConnections);
  const connect = useServerFn(connectCses);
  const disconnect = useServerFn(disconnectPlatform);

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const connections = useQuery({
    queryKey: ["coding_connections"],
    queryFn: () => list(),
  });
  const cses = (connections.data ?? []).find((c) => c.platform === "cses");

  const doConnect = useMutation({
    mutationFn: () => connect({ data: { username: username.trim(), password } }),
    onSuccess: (result) => {
      setPassword("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["coding_connections"] });
      toast.success(`CSES connected as ${result.handle}`);
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const doDisconnect = useMutation({
    mutationFn: () => disconnect({ data: { platform: "cses" } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["coding_connections"] });
      toast.success("CSES disconnected");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const connected = cses?.status === "connected";

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-3.5 shadow-[0_1px_0_0_hsl(var(--border))]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="relative flex flex-wrap items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/60">
          <PlatformLogo platform="cses" className="size-5" />
        </span>
        <div className="mr-auto min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold">
            CSES connection
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                connected
                  ? "bg-primary/15 text-primary"
                  : cses?.status === "expired"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {connected ? "Connected" : cses?.status === "expired" ? "Expired" : "Not connected"}
            </span>
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {connected
              ? `${cses?.handle ?? "your account"}${
                  cses?.platformUserId ? ` (#${cses.platformUserId})` : ""
                } · solved count and submission dates sync automatically`
              : cses?.status === "expired"
                ? "Session expired — reconnect to keep syncing solved tasks."
                : "CSES hides solved tasks behind login. Connect your own account to sync them."}
          </p>
        </div>
        {connected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={doDisconnect.isPending}
            onClick={() => doDisconnect.mutate()}
          >
            <Link2Off className="size-3.5" />
            Disconnect
          </Button>
        ) : (
          <Button type="button" size="sm" className="h-8" onClick={() => setOpen(true)}>
            <Link2 className="size-3.5" />
            Connect CSES
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your CSES account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">CSES username</Label>
              <Input
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CSES password</Label>
              <Input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <p className="flex gap-2 rounded-md border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Your password is sent once to cses.fi to create a session and is never stored. Only
              the encrypted session is kept on the server, and you can disconnect at any time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={doConnect.isPending || !username.trim() || !password}
              onClick={() => doConnect.mutate()}
            >
              {doConnect.isPending ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}