import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/platform-logo";
import { lookupCsesUser } from "@/lib/cses-public.functions";
import { describeError } from "@/lib/devos-queries";

/**
 * CSES has no OAuth and no API, but cses.fi/user/{id} is fully public.
 * DevOS reads that page directly from the numeric id — no password, no session,
 * nothing stored — and shows exactly what CSES publishes for the account.
 */
export function CsesConnect({
  userId,
  onVerified,
}: {
  userId: string;
  onVerified?: (profile: { handle: string; submissions: number | null; profileUrl: string }) => void;
}) {
  const lookup = useServerFn(lookupCsesUser);
  const id = userId.replace(/\D/g, "");

  const verify = useMutation({
    mutationFn: async (value: string) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("CSES lookup timed out. Please try again.")),
          10_000,
        );
      });

      try {
        return await Promise.race([lookup({ data: { userId: value } }), timeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  // Auto-lookup: as soon as a plausible id is typed we read the public profile
  // once for that id — no button click, no password. The ref guard keeps this
  // from re-firing on every render/keystroke.
  const checked = useRef<string | null>(null);
  const verifyRef = useRef(verify);
  verifyRef.current = verify;
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    if (id.length < 4 || checked.current === id) return;
    const timer = setTimeout(() => {
      checked.current = id;
      verifyRef.current.mutate(id);
    }, 700);
    return () => clearTimeout(timer);
  }, [id]);

  const data = verify.data && verify.data.userId === id ? verify.data : null;

  useEffect(() => {
    if (data) {
      onVerifiedRef.current?.({
        handle: data.handle,
        submissions: data.submissions,
        profileUrl: data.profileUrl,
      });
    }
  }, [data]);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-3.5">
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
            CSES account
            <span
              className={
                data
                  ? "rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                  : "rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              }
            >
              {data
                ? "Verified"
                : verify.isPending
                  ? "Reading public profile…"
                  : verify.isError
                    ? "Lookup failed"
                    : id
                      ? "Waiting for id"
                      : "Enter your id"}
            </span>
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {data
              ? `${data.handle} · ${data.submissions ?? 0} submissions${
                  data.lastSubmission ? ` · last ${data.lastSubmission.slice(0, 10)}` : ""
                }`
              : verify.isError
              ? describeError(verify.error)
              : "No password needed — your public CSES profile is read straight from your user id."}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!id || verify.isPending}
          onClick={() => {
            checked.current = id;
            verify.mutate(id);
          }}
        >
          <RefreshCw className={verify.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
          {verify.isPending ? "Checking…" : data ? "Refresh" : "Verify id"}
        </Button>
      </div>

      {data ? (
        <div className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Submissions", value: String(data.submissions ?? "—") },
            { label: "First", value: data.firstSubmission?.slice(0, 10) ?? "—" },
            { label: "Last", value: data.lastSubmission?.slice(0, 10) ?? "—" },
            {
              label: "Languages",
              value: data.languages.map((l) => l.name).join(", ") || "—",
            },
          ].map((cell) => (
            <div key={cell.label} className="rounded-lg border border-border/60 bg-background/40 p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {cell.label}
              </p>
              <p className="truncate text-xs font-semibold">{cell.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <p className="relative mt-3 flex gap-2 rounded-md border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
        {data ? (
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
        ) : (
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        )}
        DevOS never asks for your CSES password. Only the public profile page is read, so the
        submissions, activity dates and languages sync automatically. CSES keeps the solved-task
        count behind login, so type it in the “Problems solved” field below — syncing never
        overwrites it.
      </p>
    </section>
  );
}
