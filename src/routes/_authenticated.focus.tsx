import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  describeError,
  focusSessionsQuery,
  requireUserId,
  runWithRetry,
} from "@/lib/devos-queries";
import {
  FOCUS_DEFAULT_MINUTES,
  FOCUS_MODES,
  FOCUS_MODE_LABEL,
  type FocusSession,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus Timer — DevOS" },
      {
        name: "description",
        content:
          "A pomodoro focus timer that logs every session, tracks deep-work minutes per day and keeps a history of what you worked on.",
      },
      { property: "og:title", content: "Focus Timer — DevOS" },
      {
        property: "og:description",
        content: "Pomodoro sessions with automatic logging and daily focus stats.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FocusPage,
});

const MODE_ACCENT: Record<string, string> = {
  focus: "text-primary",
  short_break: "text-emerald-400",
  long_break: "text-sky-400",
};

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60, 90];

/** Plays a short repeating beep with the WebAudio API (no asset needed). */
function playAlarm(times = 3) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    for (let i = 0; i < times; i += 1) {
      const at = ctx.currentTime + i * 0.55;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.45);
    }
    window.setTimeout(() => void ctx.close(), times * 600 + 400);
  } catch {
    /* audio unavailable — ignore */
  }
}

function FocusPage() {
  const qc = useQueryClient();
  const sessions = useQuery(focusSessionsQuery());

  const [durations, setDurations] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.entries(FOCUS_DEFAULT_MINUTES).map(([k, v]) => [k, v * 60])),
  );
  const [mode, setMode] = useState<string>("focus");
  const [label, setLabel] = useState("");
  const [remaining, setRemaining] = useState(FOCUS_DEFAULT_MINUTES['focus']! * 60);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const total = durations[mode] ?? 25 * 60;

  const logSession = useMutation({
    mutationFn: async (payload: {
      mode: string;
      label: string | null;
      planned_minutes: number;
      actual_seconds: number;
      completed: boolean;
      started_at: string;
    }) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("focus_sessions").insert({
          ...payload,
          ended_at: new Date().toISOString(),
          user_id,
        });
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["focus_sessions"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("focus_sessions").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["focus_sessions"] });
      toast.success("Session removed");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const save = useCallback(
    (completed: boolean) => {
      const elapsed = elapsedRef.current;
      if (elapsed < 10) return;
      logSession.mutate({
        mode,
        label: label.trim() || null,
        planned_minutes: Math.max(1, Math.round((durations[mode] ?? 1500) / 60)),
        actual_seconds: elapsed,
        completed,
        started_at: startedAtRef.current ?? new Date().toISOString(),
      });
      elapsedRef.current = 0;
      startedAtRef.current = null;
    },
    [durations, label, logSession, mode],
  );

  // Countdown tick.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      setRemaining((r) => r - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Session completion.
  useEffect(() => {
    if (remaining > 0 || !running) return;
    setRunning(false);
    setRemaining(0);
    save(true);
    playAlarm();
    toast.success(`${FOCUS_MODE_LABEL[mode]} session complete`);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("DevOS Focus Timer", {
        body: `${FOCUS_MODE_LABEL[mode]} session finished.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const switchMode = (next: string) => {
    if (running && elapsedRef.current >= 10) save(false);
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    startedAtRef.current = null;
    setMode(next);
    setRemaining(durations[next] ?? 1500);
  };

  const start = () => {
    if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    setRunning(true);
  };

  const reset = () => {
    if (elapsedRef.current >= 10) save(false);
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    startedAtRef.current = null;
    setRemaining(total);
  };

  const hms = {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };

  const setPart = (part: "h" | "m" | "s", value: string) => {
    const n = Math.max(0, Math.min(part === "h" ? 23 : 59, Number(value) || 0));
    const next = { ...hms, [part]: n };
    const seconds = Math.max(0, next.h * 3600 + next.m * 60 + next.s);
    setDurations((d) => ({ ...d, [mode]: seconds }));
    if (!running) {
      elapsedRef.current = 0;
      setElapsed(0);
      setRemaining(seconds);
    }
  };

  const applyPreset = (minutes: number) => {
    setDurations((d) => ({ ...d, [mode]: minutes * 60 }));
    if (!running) {
      elapsedRef.current = 0;
      setElapsed(0);
      setRemaining(minutes * 60);
    }
  };

  const stats = useMemo(() => {
    const all = sessions.data ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const focusOnly = all.filter((s) => s.mode === "focus");
    const todaySeconds = focusOnly
      .filter((s) => (s.started_at ?? "").slice(0, 10) === today)
      .reduce((sum, s) => sum + s.actual_seconds, 0);
    return {
      todaySeconds,
      todayCount: focusOnly.filter((s) => (s.started_at ?? "").slice(0, 10) === today).length,
      totalSeconds: focusOnly.reduce((sum, s) => sum + s.actual_seconds, 0),
      totalCount: focusOnly.length,
    };
  }, [sessions.data]);

  const pct = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Focus Timer</h1>
          <p className="text-xs text-muted-foreground">
            {formatMinutes(stats.todaySeconds)} focused today · {stats.todayCount} sessions ·{" "}
            {formatMinutes(stats.totalSeconds)} in 30 days
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap gap-2">
              {FOCUS_MODES.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "secondary" : "ghost"}
                  className="h-8"
                  onClick={() => switchMode(m)}
                >
                  {FOCUS_MODE_LABEL[m]}
                </Button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 py-6">
              <p
                className={cn(
                  "font-mono text-6xl font-semibold tabular-nums sm:text-7xl",
                  MODE_ACCENT[mode],
                )}
              >
                {formatClock(remaining)}
              </p>
              <Progress value={pct} className="h-1.5 w-full max-w-md" />
              <p className="text-xs text-muted-foreground">
                {FOCUS_MODE_LABEL[mode]} · {formatMinutes(total)} planned
              </p>
              <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.5),inset_0_1px_0_hsl(var(--foreground)/0.05)]">
                {(["h", "m", "s"] as const).map((part, i) => (
                  <div key={part} className="flex items-end gap-2">
                    {i > 0 && (
                      <span className="pb-5 font-mono text-base text-muted-foreground/60">:</span>
                    )}
                    <div className="grid gap-1 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={part === "h" ? 23 : 59}
                        value={String(hms[part])}
                        onChange={(e) => setPart(part, e.target.value)}
                        disabled={running}
                        className={cn(
                          "h-10 w-14 rounded-lg border-border/70 bg-background/80 text-center font-mono text-lg font-semibold tabular-nums",
                          "shadow-[inset_0_1px_3px_hsl(var(--background))] transition-colors focus-visible:border-primary/60",
                          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                        )}
                        aria-label={part === "h" ? "Hours" : part === "m" ? "Minutes" : "Seconds"}
                      />
                      <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                        {part === "h" ? "hrs" : part === "m" ? "min" : "sec"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {running ? (
                <Button onClick={() => setRunning(false)}>
                  <Pause className="size-4" />
                  Pause
                </Button>
              ) : (
                <Button onClick={start} disabled={remaining <= 0}>
                  <Play className="size-4" />
                  {elapsedRef.current > 0 ? "Resume" : "Start"}
                </Button>
              )}
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  save(false);
                  setRunning(false);
                  setElapsed(0);
                  setRemaining(0);
                  playAlarm(1);
                }}
                disabled={!running && elapsedRef.current === 0}
              >
                <SkipForward className="size-4" />
                End & log
              </Button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">What are you working on?</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Refactor auth module"
                  className="h-9"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Recent sessions</h2>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="p-3">
              {sessions.isLoading ? (
                <LoadingState label="Loading sessions…" />
              ) : sessions.isError ? (
                <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
              ) : (sessions.data ?? []).length === 0 ? (
                <EmptyState
                  icon={<Timer className="size-6" />}
                  title="No sessions logged yet"
                  description="Start the timer — every session over 10 seconds is saved automatically."
                />
              ) : (
                <ul className="space-y-1.5">
                  {(sessions.data ?? []).slice(0, 40).map((s: FocusSession) => (
                    <li
                      key={s.id}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          s.mode === "focus" ? "bg-primary" : "bg-emerald-400",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">
                          {s.label || FOCUS_MODE_LABEL[s.mode] || s.mode}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(s.started_at).toLocaleString()} ·{" "}
                          {s.completed ? "completed" : "stopped early"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatMinutes(s.actual_seconds)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteSession.mutate(s.id)}
                        aria-label="Delete session"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
