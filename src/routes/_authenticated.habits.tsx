import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Archive, Flame, Pencil, Plus, Repeat, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  describeError,
  habitLogsQuery,
  habitsQuery,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  HABIT_COLORS,
  HABIT_FREQUENCIES,
  HABIT_FREQUENCY_LABEL,
  type Habit,
  type HabitLog,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [
      { title: "Habits — DevOS" },
      {
        name: "description",
        content:
          "Build daily and weekly developer habits, check them off each day and watch your streaks grow on a 30-day grid.",
      },
      { property: "og:title", content: "Habits — DevOS" },
      {
        property: "og:description",
        content: "Daily habit tracking with streaks and a 30-day completion grid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitsPage,
});

const DAYS = 30;

function isoDay(offsetFromToday = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetFromToday);
  return d.toISOString().slice(0, 10);
}

function lastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => isoDay(-(n - 1 - i)));
}

function streaks(dates: Set<string>): { current: number; best: number } {
  let current = 0;
  for (let i = 0; i < 365; i++) {
    const day = isoDay(-i);
    if (dates.has(day)) current++;
    else if (i > 0 || !dates.has(isoDay(0))) {
      if (i === 0) continue;
      break;
    }
  }
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(`${d}T12:00:00`);
    if (prev && (cur.getTime() - prev.getTime()) / 86400000 === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return { current, best };
}

type HabitDraft = {
  id?: string;
  name: string;
  description: string;
  frequency: string;
  target_per_period: string;
  color: string;
};

function emptyDraft(): HabitDraft {
  return {
    name: "",
    description: "",
    frequency: "daily",
    target_per_period: "1",
    color: HABIT_COLORS[0]!,
  };
}

function toDraft(habit: Habit): HabitDraft {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description ?? "",
    frequency: habit.frequency,
    target_per_period: String(habit.target_per_period),
    color: habit.color,
  };
}

function HabitsPage() {
  const qc = useQueryClient();
  const habits = useQuery(habitsQuery());
  const logs = useQuery(habitLogsQuery());

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState<HabitDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const cachedHabit = (id: string) =>
    (qc.getQueryData<Habit[]>(["habits"]) ?? []).find((h) => h.id === id) ?? { id };

  const days = useMemo(() => lastDays(DAYS), []);
  const today = isoDay(0);

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Map<string, HabitLog>>();
    for (const log of logs.data ?? []) {
      const inner = map.get(log.habit_id) ?? new Map<string, HabitLog>();
      inner.set(log.log_date, log);
      map.set(log.habit_id, inner);
    }
    return map;
  }, [logs.data]);

  const saveHabit = useMutation({
    mutationFn: async (value: HabitDraft) => {
      const payload = {
        name: value.name.trim(),
        description: value.description.trim() || null,
        frequency: value.frequency,
        target_per_period: Math.max(1, Number(value.target_per_period) || 1),
        color: value.color,
      };
      if (value.id) {
        await updateRow("habits", cachedHabit(value.id), payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("habits").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success(value.id ? "Habit updated" : "Habit created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchHabit = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Habit> }) =>
      updateRow("habits", cachedHabit(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["habits"] });
      const previous = qc.getQueryData<Habit[]>(["habits"]);
      qc.setQueryData<Habit[]>(["habits"], (old) =>
        (old ?? []).map((h) => (h.id === id ? { ...h, ...patch } : h)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["habits"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("habits").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["habits"] });
      void qc.invalidateQueries({ queryKey: ["habit_logs"] });
      toast.success("Habit deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const toggleDay = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const existing = logsByHabit.get(habitId)?.get(date);
      await runWithRetry(async () => {
        if (existing) {
          const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
          assertOk(error);
          return;
        }
        const user_id = await requireUserId();
        const { error } = await supabase
          .from("habit_logs")
          .insert({ habit_id: habitId, log_date: date, user_id });
        assertOk(error);
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["habit_logs"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (habits.data ?? []).filter((h) => {
      if (!showArchived && h.archived) return false;
      if (!term) return true;
      return `${h.name} ${h.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [habits.data, search, showArchived]);

  const doneToday = visible.filter((h) => logsByHabit.get(h.id)?.has(today)).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Habits</h1>
          <p className="text-xs text-muted-foreground">
            {doneToday}/{visible.length} done today
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search habits"
            className="h-8 w-48 pl-7 text-xs"
          />
        </div>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          className="h-8"
          onClick={() => setShowArchived((v) => !v)}
        >
          <Archive className="size-3.5" />
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
        <Button size="sm" className="h-8" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-3.5" />
          New habit
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {habits.isLoading || logs.isLoading ? (
            <LoadingState label="Loading habits…" />
          ) : habits.isError ? (
            <ErrorState error={habits.error} onRetry={() => void habits.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Repeat className="size-6" />}
              title={habits.data?.length ? "No matching habits" : "No habits yet"}
              description="Track daily rituals like solving one problem, shipping a commit or reading docs."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-3.5" />
                  New habit
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {visible.map((habit) => {
                const dates = new Set((logsByHabit.get(habit.id) ?? new Map()).keys());
                const { current, best } = streaks(dates);
                const checkedToday = dates.has(today);
                return (
                  <article
                    key={habit.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-4",
                      habit.archived && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleDay.mutate({ habitId: habit.id, date: today })}
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          checkedToday
                            ? "border-transparent text-background"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                        style={checkedToday ? { backgroundColor: habit.color } : undefined}
                        aria-label={checkedToday ? "Undo today" : "Mark done today"}
                      >
                        <Repeat className="size-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-medium">{habit.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">
                          {HABIT_FREQUENCY_LABEL[habit.frequency]} · target{" "}
                          {habit.target_per_period}×
                          {habit.description ? ` · ${habit.description}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <Flame className="size-3.5" />
                        {current} day streak
                      </span>
                      <span className="text-[11px] text-muted-foreground">best {best}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <Pencil className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDraft(toDraft(habit))}>
                            <Pencil className="size-3.5" />
                            Edit habit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              patchHabit.mutate({
                                id: habit.id,
                                patch: { archived: !habit.archived },
                              })
                            }
                          >
                            <Archive className="size-3.5" />
                            {habit.archived ? "Unarchive" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setConfirm({
                                title: "Delete habit?",
                                description: `"${habit.name}" and its history will be permanently removed.`,
                                onConfirm: () => deleteHabit.mutate(habit.id),
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {days.map((day) => {
                        const done = dates.has(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            title={day}
                            onClick={() => toggleDay.mutate({ habitId: habit.id, date: day })}
                            className={cn(
                              "size-4 rounded-sm border transition-colors",
                              done ? "border-transparent" : "border-border bg-muted/40",
                              day === today && "ring-1 ring-primary/60",
                            )}
                            style={done ? { backgroundColor: habit.color } : undefined}
                            aria-label={`${habit.name} on ${day}`}
                          />
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit habit" : "New habit"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Solve one DSA problem"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Frequency</Label>
                  <Select
                    value={draft.frequency}
                    onValueChange={(v) => setDraft({ ...draft, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {HABIT_FREQUENCY_LABEL[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Target per period</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.target_per_period}
                    onChange={(e) => setDraft({ ...draft, target_per_period: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft({ ...draft, color: c })}
                      className={cn(
                        "size-6 rounded-full ring-offset-2 ring-offset-background",
                        draft.color === c && "ring-2 ring-primary",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Use color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              disabled={!draft?.name.trim() || saveHabit.isPending}
              onClick={() => draft && saveHabit.mutate(draft)}
            >
              {saveHabit.isPending ? "Saving…" : draft?.id ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
