import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ArrowDown,
  ArrowUp,
  Pencil,
  Pin,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
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
  goalMilestonesQuery,
  goalsQuery,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABEL,
  GOAL_PRIORITIES,
  GOAL_PRIORITY_LABEL,
  GOAL_STATUSES,
  GOAL_STATUS_LABEL,
  GOAL_TIMEFRAMES,
  GOAL_TIMEFRAME_LABEL,
  type Goal,
  type GoalMilestone,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals — DevOS" },
      {
        name: "description",
        content:
          "Set developer goals with measurable targets, milestones, priorities and due dates, and track progress as you go.",
      },
      { property: "og:title", content: "Goals — DevOS" },
      {
        property: "og:description",
        content: "Measurable developer goals with milestones and live progress tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalsPage,
});

const STATUS_CLASS: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  paused: "bg-amber-500/15 text-amber-400",
  done: "bg-emerald-500/15 text-emerald-400",
  dropped: "bg-muted text-muted-foreground/70",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-sky-400",
  high: "text-rose-400",
};

type GoalDraft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  customCategory: string;
  timeframe: string;
  status: string;
  priority: string;
  target_value: string;
  current_value: string;
  unit: string;
  due_date: string;
};

const CUSTOM = "__custom__";

function emptyDraft(): GoalDraft {
  return {
    title: "",
    description: "",
    category: "academic",
    customCategory: "",
    timeframe: "monthly",
    status: "active",
    priority: "medium",
    target_value: "100",
    current_value: "0",
    unit: "%",
    due_date: "",
  };
}

function toDraft(goal: Goal): GoalDraft {
  const known = (GOAL_CATEGORIES as readonly string[]).includes(goal.category);
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? "",
    category: known ? goal.category : CUSTOM,
    customCategory: known ? "" : goal.category,
    timeframe: (goal as Goal & { timeframe?: string }).timeframe ?? "monthly",
    status: goal.status,
    priority: goal.priority,
    target_value: String(goal.target_value ?? 100),
    current_value: String(goal.current_value ?? 0),
    unit: goal.unit,
    due_date: goal.due_date ?? "",
  };
}

function percent(goal: Goal): number {
  const target = Number(goal.target_value) || 0;
  const current = Number(goal.current_value) || 0;
  if (target <= 0) return goal.status === "done" ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function GoalsPage() {
  const qc = useQueryClient();
  const goals = useQuery(goalsQuery());
  const milestones = useQuery(goalMilestonesQuery());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [milestoneInput, setMilestoneInput] = useState<Record<string, string>>({});

  const cachedGoal = (id: string) =>
    (qc.getQueryData<Goal[]>(["goals"]) ?? []).find((g) => g.id === id) ?? { id };
  const cachedMilestone = (id: string) =>
    (qc.getQueryData<GoalMilestone[]>(["goal_milestones"]) ?? []).find((m) => m.id === id) ?? { id };

  const saveGoal = useMutation({
    mutationFn: async (value: GoalDraft) => {
      const payload = {
        title: value.title.trim(),
        description: value.description.trim() || null,
        category:
          value.category === CUSTOM
            ? value.customCategory.trim().toLowerCase() || "custom"
            : value.category,
        timeframe: value.timeframe,
        status: value.status,
        priority: value.priority,
        target_value: Number(value.target_value) || 0,
        current_value: Number(value.current_value) || 0,
        unit: value.unit.trim() || "%",
        due_date: value.due_date || null,
      };
      if (value.id) {
        await updateRow("goals", cachedGoal(value.id), payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("goals").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success(value.id ? "Goal updated" : "Goal created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchGoal = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Goal> }) =>
      updateRow("goals", cachedGoal(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["goals"] });
      const previous = qc.getQueryData<Goal[]>(["goals"]);
      qc.setQueryData<Goal[]>(["goals"], (old) =>
        (old ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["goals"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("goals").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goals"] });
      void qc.invalidateQueries({ queryKey: ["goal_milestones"] });
      toast.success("Goal deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const addMilestone = useMutation({
    mutationFn: async ({ goalId, title }: { goalId: string; title: string }) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase
          .from("goal_milestones")
          .insert({ goal_id: goalId, title, user_id });
        assertOk(error);
      }),
    onSuccess: (_d, v) => {
      setMilestoneInput((s) => ({ ...s, [v.goalId]: "" }));
      void qc.invalidateQueries({ queryKey: ["goal_milestones"] });
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchMilestone = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GoalMilestone> }) =>
      updateRow("goal_milestones", cachedMilestone(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["goal_milestones"] });
      const previous = qc.getQueryData<GoalMilestone[]>(["goal_milestones"]);
      qc.setQueryData<GoalMilestone[]>(["goal_milestones"], (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["goal_milestones"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["goal_milestones"] }),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("goal_milestones").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["goal_milestones"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (goals.data ?? []).filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (!term) return true;
      return `${g.title} ${g.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [goals.data, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const all = goals.data ?? [];
    return {
      total: all.length,
      active: all.filter((g) => g.status === "active").length,
      done: all.filter((g) => g.status === "done").length,
    };
  }, [goals.data]);

  const milestonesFor = (goalId: string) =>
    (milestones.data ?? []).filter((m) => m.goal_id === goalId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Goals</h1>
          <p className="text-xs text-muted-foreground">
            {stats.total} goals · {stats.active} active · {stats.done} completed
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals"
            className="h-8 w-48 pl-7 text-xs"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {GOAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {GOAL_CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {GOAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {GOAL_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-3.5" />
          New goal
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {goals.isLoading ? (
            <LoadingState label="Loading goals…" />
          ) : goals.isError ? (
            <ErrorState error={goals.error} onRetry={() => void goals.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Target className="size-6" />}
              title={goals.data?.length ? "No matching goals" : "No goals yet"}
              description="Create a measurable goal — target value, unit, due date — and break it into milestones."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-3.5" />
                  New goal
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visible.map((goal) => {
                const items = milestonesFor(goal.id);
                const doneCount = items.filter((m) => m.done).length;
                const pct = percent(goal);
                return (
                  <article
                    key={goal.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {goal.pinned ? <Pin className="size-3.5 text-primary" /> : null}
                          <h2 className="truncate text-sm font-medium">{goal.title}</h2>
                        </div>
                        {goal.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {goal.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_CLASS[goal.status],
                        )}
                      >
                        {GOAL_STATUS_LABEL[goal.status]}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <Pencil className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDraft(toDraft(goal))}>
                            <Pencil className="size-3.5" />
                            Edit goal
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              patchGoal.mutate({ id: goal.id, patch: { pinned: !goal.pinned } })
                            }
                          >
                            <Pin className="size-3.5" />
                            {goal.pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              patchGoal.mutate({
                                id: goal.id,
                                patch: {
                                  status: goal.status === "done" ? "active" : "done",
                                  current_value:
                                    goal.status === "done"
                                      ? goal.current_value
                                      : Number(goal.target_value),
                                },
                              })
                            }
                          >
                            <Check className="size-3.5" />
                            {goal.status === "done" ? "Reopen" : "Mark complete"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setConfirm({
                                title: "Delete goal?",
                                description: `"${goal.title}" and its milestones will be permanently removed.`,
                                onConfirm: () => deleteGoal.mutate(goal.id),
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {Number(goal.current_value)} / {Number(goal.target_value)} {goal.unit}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          value={String(goal.current_value)}
                          onChange={(e) =>
                            patchGoal.mutate({
                              id: goal.id,
                              patch: { current_value: Number(e.target.value) || 0 },
                            })
                          }
                          className="h-7 w-24 text-xs"
                        />
                        <span className="text-[11px] text-muted-foreground">
                          update progress ({goal.unit})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {GOAL_CATEGORY_LABEL[goal.category] ?? goal.category}
                      </span>
                      <span className={cn("font-medium", PRIORITY_CLASS[goal.priority])}>
                        {GOAL_PRIORITY_LABEL[goal.priority]} priority
                      </span>
                      {goal.due_date ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3.5" />
                          {goal.due_date}
                        </span>
                      ) : null}
                      {items.length ? (
                        <span>
                          {doneCount}/{items.length} milestones
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1 border-t border-border pt-3">
                      {items.map((m) => (
                        <div key={m.id} className="group flex items-center gap-2">
                          <Checkbox
                            checked={m.done}
                            onCheckedChange={(v) =>
                              patchMilestone.mutate({ id: m.id, patch: { done: v === true } })
                            }
                          />
                          <span
                            className={cn(
                              "flex-1 truncate text-xs",
                              m.done && "text-muted-foreground line-through",
                            )}
                          >
                            {m.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteMilestone.mutate(m.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const title = (milestoneInput[goal.id] ?? "").trim();
                          if (!title) return;
                          addMilestone.mutate({ goalId: goal.id, title });
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <Input
                          value={milestoneInput[goal.id] ?? ""}
                          onChange={(e) =>
                            setMilestoneInput((s) => ({ ...s, [goal.id]: e.target.value }))
                          }
                          placeholder="Add milestone…"
                          className="h-7 text-xs"
                        />
                        <Button type="submit" size="icon" variant="ghost" className="size-7">
                          <Plus className="size-3.5" />
                        </Button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit goal" : "New goal"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Solve 300 DSA problems"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Current</Label>
                  <Input
                    type="number"
                    value={draft.current_value}
                    onChange={(e) => setDraft({ ...draft, current_value: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Target</Label>
                  <Input
                    type="number"
                    value={draft.target_value}
                    onChange={(e) => setDraft({ ...draft, target_value: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={draft.unit}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    placeholder="%"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) => setDraft({ ...draft, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {GOAL_CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) => setDraft({ ...draft, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {GOAL_PRIORITY_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) => setDraft({ ...draft, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {GOAL_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Due date</Label>
                  <Input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              disabled={!draft?.title.trim() || saveGoal.isPending}
              onClick={() => draft && saveGoal.mutate(draft)}
            >
              {saveGoal.isPending ? "Saving…" : draft?.id ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
