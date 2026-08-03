import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { PlatformLogo } from "@/components/platform-logo";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getUpcomingContests, type UpcomingContest } from "@/lib/contests.functions";
import {
  assertOk,
  calendarEventsQuery,
  describeError,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  EVENT_KINDS,
  EVENT_KIND_COLOR,
  EVENT_KIND_LABEL,
  CODING_PLATFORM_LABEL,
  type CalendarEvent,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — DevOS" },
      {
        name: "description",
        content:
          "Plan interviews, deadlines, contests and study blocks on a month calendar built into DevOS.",
      },
      { property: "og:title", content: "Calendar — DevOS" },
      {
        property: "og:description",
        content: "A developer calendar for interviews, deadlines, contests and study sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday-first grid of 42 days covering the given month. */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

function formatTime(value: string | null): string {
  if (!value) return "";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

type EventDraft = {
  id?: string;
  title: string;
  description: string;
  kind: string;
  event_date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string;
  url: string;
};

function emptyDraft(date: string): EventDraft {
  return {
    title: "",
    description: "",
    kind: "task",
    event_date: date,
    start_time: "",
    end_time: "",
    all_day: true,
    location: "",
    url: "",
  };
}

function toDraft(e: CalendarEvent): EventDraft {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? "",
    kind: e.kind,
    event_date: e.event_date,
    start_time: e.start_time?.slice(0, 5) ?? "",
    end_time: e.end_time?.slice(0, 5) ?? "",
    all_day: e.all_day,
    location: e.location ?? "",
    url: e.url ?? "",
  };
}

function CalendarPage() {
  const qc = useQueryClient();
  const events = useQuery(calendarEventsQuery());
  const fetchContests = useServerFn(getUpcomingContests);
  const contests = useQuery({
    queryKey: ["upcoming_contests"],
    queryFn: () => fetchContests(),
    staleTime: 15 * 60 * 1000,
  });

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toIso(today));
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const findCachedRow = (id: string): { id: string } =>
    (qc.getQueryData<CalendarEvent[]>(["calendar_events"]) ?? []).find((r) => r.id === id) ?? {
      id,
    };

  const addContest = useMutation({
    mutationFn: async (contest: UpcomingContest) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const start = new Date(contest.startsAt);
        const { error } = await supabase.from("calendar_events").insert({
          user_id,
          title: contest.name,
          description: `${CODING_PLATFORM_LABEL[contest.platform] ?? contest.platform} contest · ${contest.durationMinutes} min`,
          kind: "contest",
          event_date: toIso(start),
          all_day: false,
          start_time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
          url: contest.url,
          color: EVENT_KIND_COLOR["contest"] ?? "#34d399",
        });
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success("Contest added to your calendar");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const saveEvent = useMutation({
    mutationFn: async (value: EventDraft) => {
      const payload = {
        title: value.title.trim(),
        description: value.description.trim() || null,
        kind: value.kind,
        event_date: value.event_date,
        all_day: value.all_day,
        start_time: value.all_day ? null : value.start_time || null,
        end_time: value.all_day ? null : value.end_time || null,
        location: value.location.trim() || null,
        url: value.url.trim() || null,
        color: EVENT_KIND_COLOR[value.kind] ?? "#8b5cf6",
      };
      if (value.id) {
        await updateRow("calendar_events", findCachedRow(value.id), payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("calendar_events").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      setSelected(value.event_date);
      void qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success(value.id ? "Event updated" : "Event added");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchEvent = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CalendarEvent> }) =>
      updateRow("calendar_events", findCachedRow(id), patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["calendar_events"] });
      const previous = qc.getQueryData<CalendarEvent[]>(["calendar_events"]);
      qc.setQueryData<CalendarEvent[]>(["calendar_events"], (old) =>
        (old ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["calendar_events"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["calendar_events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("calendar_events").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success("Event deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events.data ?? []) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events.data]);

  const days = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const contestsByDate = useMemo(() => {
    const map = new Map<string, UpcomingContest[]>();
    for (const c of contests.data ?? []) {
      const iso = toIso(new Date(c.startsAt));
      const list = map.get(iso) ?? [];
      list.push(c);
      map.set(iso, list);
    }
    return map;
  }, [contests.data]);

  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const upcoming = useMemo(() => {
    const iso = toIso(today);
    return (events.data ?? []).filter((e) => e.event_date >= iso && !e.completed).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.data]);

  const [remindersOn, setRemindersOn] = useState(false);
  const firedRef = useRef<Set<string>>(new Set());

  const [syncing, setSyncing] = useState(false);
  const goToToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(toIso(now));
    setExpandedDay(null);
  };
  const handleSync = async () => {
    if (syncing) return; // debounce rapid clicks
    setSyncing(true);
    try {
      await Promise.all([contests.refetch(), events.refetch()]);
      goToToday();
      toast.success("Calendar synced to today");
    } catch (e) {
      goToToday();
      toast.error(describeError(e) || "Couldn't refresh contests");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setRemindersOn(Notification.permission === "granted");
  }, []);

  // Schedule browser reminders 10 minutes before each of today's timed events.
  useEffect(() => {
    if (!remindersOn || typeof window === "undefined" || !("Notification" in window)) return;
    const iso = toIso(new Date());
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const e of events.data ?? []) {
      if (e.completed || e.event_date !== iso || !e.start_time) continue;
      const when = new Date(`${e.event_date}T${e.start_time}`).getTime() - 10 * 60 * 1000;
      const delay = when - Date.now();
      if (delay <= 0 || delay > 12 * 60 * 60 * 1000 || firedRef.current.has(e.id)) continue;
      timers.push(
        setTimeout(() => {
          firedRef.current.add(e.id);
          new Notification(e.title, {
            body: `${EVENT_KIND_LABEL[e.kind] ?? e.kind} starts at ${formatTime(e.start_time)}`,
          });
        }, delay),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [events.data, remindersOn]);

  const enableReminders = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    if (remindersOn) {
      setRemindersOn(false);
      toast.success("Reminders paused");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Allow notifications to get reminders.");
      return;
    }
    setRemindersOn(true);
    toast.success("Reminders on — you'll be pinged 10 minutes before each event");
  };

  if (events.isLoading) return <LoadingState label="Loading your calendar…" />;
  if (events.error)
    return <ErrorState error={events.error} onRetry={() => void events.refetch()} />;

  const selectedEvents = byDate.get(selected) ?? [];
  const selectedContests = contestsByDate.get(selected) ?? [];
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
          <p className="text-xs text-muted-foreground">
            {events.data?.length ?? 0} event{(events.data?.length ?? 0) === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-40 text-center text-sm font-medium">{monthLabel}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelected(toIso(now));
          }}
        >
          Today
        </Button>
        <Button
          variant={remindersOn ? "secondary" : "outline"}
          size="sm"
          onClick={() => void enableReminders()}
        >
          <Bell className={cn("size-4", remindersOn && "text-primary")} />
          {remindersOn ? "Reminders on" : "Reminders"}
        </Button>
        <Button size="sm" onClick={() => setDraft(emptyDraft(selected))}>
          <Plus className="size-4" />
          New event
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 max-lg:overflow-x-auto">
          <div className="min-w-[760px] lg:min-w-0">
            <div className="grid grid-cols-7 gap-px text-xs uppercase tracking-wide text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px overflow-visible rounded-xl border border-border bg-border">
              {days.map((day) => {
                const iso = toIso(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = iso === toIso(today);
                const dayEvents = byDate.get(iso) ?? [];
                const dayContests = contestsByDate.get(iso) ?? [];
                const expanded = expandedDay === iso;
                const hasOverflow = dayEvents.length + dayContests.length > 3;
                return (
                  <div
                    key={iso}
                    className={cn(
                      "relative min-h-32 sm:min-h-36",
                      expanded && hasOverflow ? "z-30" : "z-0",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(iso);
                        setExpandedDay((cur) => (cur === iso ? null : iso));
                      }}
                      onDoubleClick={() => setDraft(emptyDraft(iso))}
                      onMouseEnter={() => setExpandedDay(iso)}
                      onMouseLeave={() => setExpandedDay((cur) => (cur === iso ? null : cur))}
                      className={cn(
                        "absolute inset-0 z-[1] flex flex-col gap-1.5 overflow-hidden bg-card p-2 text-left transition-all duration-200 ease-out hover:bg-accent/40",
                        !inMonth && "bg-card/40 text-muted-foreground/50",
                        selected === iso && "ring-1 ring-inset ring-primary",
                        expanded &&
                          hasOverflow &&
                          "bottom-auto z-30 h-auto max-h-[300px] min-h-full overflow-y-auto rounded-lg bg-popover shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-primary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isToday &&
                            "inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <span className="flex flex-col gap-1">
                        {dayEvents.slice(0, expanded ? dayEvents.length : 3).map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[11px]",
                              e.completed && "line-through opacity-60",
                            )}
                            style={{ backgroundColor: `${e.color}22`, color: e.color }}
                          >
                            {e.title}
                          </span>
                        ))}
                        {dayContests
                          .slice(
                            0,
                            expanded ? dayContests.length : Math.max(0, 3 - dayEvents.length),
                          )
                          .map((c) => (
                            <span
                              key={c.id}
                              title={c.name}
                              className="flex items-center gap-1.5 rounded bg-muted/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              <PlatformLogo platform={c.platform} className="size-3.5 shrink-0" />
                              <span className="truncate">{c.name}</span>
                            </span>
                          ))}
                        {!expanded && hasOverflow ? (
                          <span className="text-[11px] text-muted-foreground">
                            +{dayEvents.length + dayContests.length - 3} more
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium">
              {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              aria-label="Refresh contests"
              onClick={() => void contests.refetch()}
            >
              <RefreshCw className={cn("size-4", contests.isFetching && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setDraft(emptyDraft(selected))}>
              <Plus className="size-4" />
              Add event
            </Button>
          </div>

          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!quickTitle.trim()) return;
              saveEvent.mutate({ ...emptyDraft(selected), title: quickTitle });
              setQuickTitle("");
            }}
          >
            <Input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={`Add something on ${new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}…`}
              className="flex-1"
            />
            <Button type="submit" disabled={saveEvent.isPending || !quickTitle.trim()}>
              {saveEvent.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add
            </Button>
          </form>

          {selectedEvents.length === 0 && selectedContests.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nothing scheduled"
              description="Use the field above, or double-click any day to add an event."
            />
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {selectedEvents.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-border bg-card p-3"
                  style={{ borderLeft: `3px solid ${e.color}` }}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={e.completed}
                      aria-label="Mark done"
                      onCheckedChange={(v) =>
                        patchEvent.mutate({ id: e.id, patch: { completed: Boolean(v) } })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          e.completed && "line-through text-muted-foreground",
                        )}
                      >
                        {e.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {EVENT_KIND_LABEL[e.kind] ?? e.kind}
                        {e.all_day
                          ? " · All day"
                          : e.start_time
                            ? ` · ${formatTime(e.start_time)}${e.end_time ? ` – ${formatTime(e.end_time)}` : ""}`
                            : ""}
                      </p>
                      {e.description ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                          {e.description}
                        </p>
                      ) : null}
                      {e.location ? (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3" />
                          {e.location}
                        </p>
                      ) : null}
                      {e.url ? (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Open link
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit event"
                        onClick={() => setDraft(toDraft(e))}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete event"
                        onClick={() =>
                          setConfirm({
                            title: "Delete event?",
                            description: `"${e.title}" will be permanently removed.`,
                            confirmLabel: "Delete",
                            onConfirm: () => deleteEvent.mutate(e.id),
                          })
                        }
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}

              {selectedContests.map((c) => {
                const start = new Date(c.startsAt);
                const added = (events.data ?? []).some(
                  (e) => e.url === c.url && e.kind === "contest",
                );
                return (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <PlatformLogo platform={c.platform} className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 text-sm font-medium hover:underline"
                      >
                        {c.name}
                      </a>
                      <p className="text-[11px] text-muted-foreground">
                        {start.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {c.durationMinutes} min
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={added ? "Already in calendar" : "Add contest to calendar"}
                      disabled={added || addContest.isPending}
                      onClick={() => addContest.mutate(c)}
                    >
                      {added ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {upcoming.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                Upcoming
              </h3>
              <ul className="flex flex-wrap gap-2">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(`${e.event_date}T00:00:00`);
                        setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                        setSelected(e.event_date);
                      }}
                      className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent/50"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                      <span className="max-w-40 truncate">{e.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(`${e.event_date}T00:00:00`).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft?.title.trim()) return;
              saveEvent.mutate(draft);
            }}
          >
            <DialogHeader>
              <DialogTitle>{draft?.id ? "Edit event" : "New event"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  autoFocus
                  value={draft?.title ?? ""}
                  onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                  placeholder="Frontend interview — Acme"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={draft?.kind ?? "task"}
                    onValueChange={(v) => setDraft((d) => (d ? { ...d, kind: v } : d))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {EVENT_KIND_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={draft?.event_date ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, event_date: e.target.value } : d))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft?.all_day ?? true}
                  onCheckedChange={(v) => setDraft((d) => (d ? { ...d, all_day: Boolean(v) } : d))}
                />
                All day
              </label>
              {!draft?.all_day ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event-start">Starts</Label>
                    <Input
                      id="event-start"
                      type="time"
                      value={draft?.start_time ?? ""}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, start_time: e.target.value } : d))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-end">Ends</Label>
                    <Input
                      id="event-end"
                      type="time"
                      value={draft?.end_time ?? ""}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, end_time: e.target.value } : d))
                      }
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    value={draft?.location ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                    placeholder="Remote / Bengaluru"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-url">Link</Label>
                  <Input
                    id="event-url"
                    value={draft?.url ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, url: e.target.value } : d))}
                    placeholder="https://meet.google.com/…"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-notes">Notes</Label>
                <Textarea
                  id="event-notes"
                  rows={3}
                  value={draft?.description ?? ""}
                  onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveEvent.isPending || !draft?.title.trim()}>
                {saveEvent.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {draft?.id ? "Save changes" : "Add event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
