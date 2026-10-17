import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  calculateCodingStreaks,
  type CombinedDay,
} from "@/lib/coding-activity";
import { CODING_PLATFORM_LABEL } from "@/lib/devos-types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function key(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const LEVEL_BG = [
  "color-mix(in srgb, var(--muted) 60%, transparent)",
  "color-mix(in srgb, var(--accent-color, #22c55e) 28%, transparent)",
  "color-mix(in srgb, var(--accent-color, #22c55e) 50%, transparent)",
  "color-mix(in srgb, var(--accent-color, #22c55e) 75%, transparent)",
  "var(--accent-color, #22c55e)",
];

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type PeriodOption = {
  id: string;
  label: string;
  type: "current" | "all" | "half-year";
  year?: number;
  startIso?: string;
  endIso?: string;
};

export type CodingActivityHeatmapProps = {
  days: Map<string, CombinedDay>;
  submissions?: number;
  maxStreak?: number;
  currentStreak?: number;
  className?: string;
};

/**
 * Interactive coding activity heatmap with period selection (Current, 6-month half-years, All time)
 * and horizontal sideways scrolling from the user's very first submission till date.
 */
export function CodingActivityHeatmap({
  days,
  submissions,
  maxStreak,
  currentStreak,
  className,
}: CodingActivityHeatmapProps) {
  const [hover, setHover] = useState<CombinedDay | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Determine earliest submission date across all platforms
  const { periodOptions, earliestDate } = useMemo(() => {
    const dates = Array.from(days.entries())
      .filter(([_, d]) => d.count > 0)
      .map(([date]) => date)
      .sort();

    const firstDate = dates[0] ?? null;
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0 to 11
    const startYear = firstDate
      ? Math.min(Number.parseInt(firstDate.slice(0, 4), 10), currentYear)
      : currentYear - 1;

    const list: PeriodOption[] = [
      { id: "current", label: "Current", type: "current" },
    ];

    // 6-month blocks (from present back to earliest submission year)
    for (let y = currentYear; y >= startYear; y -= 1) {
      if (y === currentYear) {
        if (currentMonth >= 6) {
          list.push({
            id: `${y}-h2`,
            label: `${y} (Jul - Dec)`,
            type: "half-year",
            year: y,
            startIso: `${y}-07-01`,
            endIso: `${y}-12-31`,
          });
        }
        list.push({
          id: `${y}-h1`,
          label: `${y} (Jan - Jun)`,
          type: "half-year",
          year: y,
          startIso: `${y}-01-01`,
          endIso: `${y}-06-30`,
        });
      } else {
        list.push({
          id: `${y}-h2`,
          label: `${y} (Jul - Dec)`,
          type: "half-year",
          year: y,
          startIso: `${y}-07-01`,
          endIso: `${y}-12-31`,
        });
        list.push({
          id: `${y}-h1`,
          label: `${y} (Jan - Jun)`,
          type: "half-year",
          year: y,
          startIso: `${y}-01-01`,
          endIso: `${y}-06-30`,
        });
      }
    }

    // "All time" option to view from first submission till date
    list.push({
      id: "all",
      label: firstDate
        ? `All time (From first: ${firstDate})`
        : "All time (From first submission)",
      type: "all",
    });

    return { periodOptions: list, earliestDate: firstDate };
  }, [days]);

  // Compute weeks, columns, month headers and period stats for current view
  const { columns, months, weeks, periodStats } = useMemo(() => {
    const now = new Date();
    const todayEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const selected = periodOptions.find((p) => p.id === selectedPeriod) ?? periodOptions[0]!;

    let rangeStartMs: number;
    let rangeEndMs: number;

    if (selected.type === "current") {
      rangeEndMs = todayEnd;
      const endOfWeek = rangeEndMs + (6 - new Date(rangeEndMs).getUTCDay()) * DAY;
      const numWeeks = 53;
      rangeStartMs = endOfWeek - (numWeeks * 7 - 1) * DAY;
    } else if (selected.type === "all") {
      rangeEndMs = todayEnd;
      if (earliestDate) {
        const earliestMs = Date.parse(`${earliestDate}T00:00:00Z`);
        const startOfWeek = earliestMs - new Date(earliestMs).getUTCDay() * DAY;
        rangeStartMs = startOfWeek;
      } else {
        const endOfWeek = rangeEndMs + (6 - new Date(rangeEndMs).getUTCDay()) * DAY;
        rangeStartMs = endOfWeek - (53 * 7 - 1) * DAY;
      }
    } else {
      // 6-month block
      const startMs = Date.parse(`${selected.startIso!}T00:00:00Z`);
      const endMs = Math.min(Date.parse(`${selected.endIso!}T00:00:00Z`), todayEnd);
      rangeStartMs = startMs - new Date(startMs).getUTCDay() * DAY;
      rangeEndMs = endMs + (6 - new Date(endMs).getUTCDay()) * DAY;
    }

    const endOfWeek = rangeEndMs + (6 - new Date(rangeEndMs).getUTCDay()) * DAY;
    const totalWeeks = Math.max(1, Math.round((endOfWeek - rangeStartMs + DAY) / (7 * DAY)));

    const cols: { date: string; day: CombinedDay | null; future: boolean }[][] = [];
    const monthLabels: { index: number; label: string }[] = [];
    let seenMonth = -1;
    let seenYear = -1;

    let totalPeriodSubmissions = 0;
    const activeDateSet = new Set<string>();

    for (let w = 0; w < totalWeeks; w += 1) {
      const col: { date: string; day: CombinedDay | null; future: boolean }[] = [];
      for (let d = 0; d < 7; d += 1) {
        const ms = rangeStartMs + (w * 7 + d) * DAY;
        const id = key(ms);
        const isFuture = ms > todayEnd;
        const dayData = days.get(id) ?? null;
        col.push({ date: id, day: dayData, future: isFuture });

        if (dayData && dayData.count > 0 && !isFuture) {
          totalPeriodSubmissions += dayData.count;
          activeDateSet.add(id);
        }

        if (d === 0) {
          const dt = new Date(ms);
          const m = dt.getUTCMonth();
          const y = dt.getUTCFullYear();
          if (m !== seenMonth || y !== seenYear) {
            seenMonth = m;
            seenYear = y;
            const label =
              totalWeeks > 60 && m === 0 ? `${MONTHS[m]} '${String(y).slice(2)}` : MONTHS[m]!;
            monthLabels.push({ index: w, label });
          }
        }
      }
      cols.push(col);
    }

    const streaks = calculateCodingStreaks(activeDateSet);

    return {
      columns: cols,
      months: monthLabels,
      weeks: totalWeeks,
      periodStats: {
        submissions: totalPeriodSubmissions,
        maxStreak: streaks.maxStreak,
        currentStreak: streaks.currentStreak,
      },
    };
  }, [days, selectedPeriod, periodOptions, earliestDate]);

  const rows = useMemo(() => {
    const r: (typeof columns)[number][] = [];
    for (let d = 0; d < 7; d += 1) {
      r.push(columns.map((col) => col[d]!));
    }
    return r;
  }, [columns]);

  // Scroll to latest (right edge) on initial mount or when period changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [selectedPeriod, weeks]);

  const scrollToStart = () => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scrollToEnd = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }
  };

  // Accurate stats based on active period selection or fallback props
  const displaySubmissions =
    selectedPeriod === "current" && submissions !== undefined
      ? submissions
      : periodStats.submissions;
  const displayMaxStreak =
    selectedPeriod === "current" && maxStreak !== undefined
      ? maxStreak
      : periodStats.maxStreak;
  const displayCurrentStreak =
    selectedPeriod === "current" && currentStreak !== undefined
      ? currentStreak
      : periodStats.currentStreak;

  return (
    <div className={cn("relative flex flex-col", className)}>
      {/* Top Controls matching LeetCode / Image 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground">Submissions</span>
            <span className="font-semibold text-foreground tabular-nums">
              {displaySubmissions}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground">Max.Streak</span>
            <span className="font-semibold text-foreground tabular-nums">
              {displayMaxStreak}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground">Current.Streak</span>
            <span className="font-semibold text-foreground tabular-nums">
              {displayCurrentStreak}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector dropdown matching Image 2 */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="h-7 w-[150px] sm:w-[175px] rounded-lg border border-border bg-white/[0.04] text-xs font-medium text-foreground">
              <SelectValue placeholder="Current" />
            </SelectTrigger>
            <SelectContent align="end" className="bg-popover/95 backdrop-blur-md border border-border shadow-xl">
              {periodOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sideways scroll buttons << and >> */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={scrollToStart}
              className="flex size-7 items-center justify-center rounded-lg border border-border bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors"
              title="Scroll to earliest submissions (first submission)"
              aria-label="Scroll to earliest submission"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollToEnd}
              className="flex size-7 items-center justify-center rounded-lg border border-border bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors"
              title="Scroll to current submissions"
              aria-label="Scroll to current submission"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sideways Scrollable Heatmap Timeline */}
      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto overflow-y-hidden pb-2.5 pt-1 scrollbar-thin scrollbar-track-white/[0.02] scrollbar-thumb-white/20 hover:scrollbar-thumb-white/35"
        tabIndex={0}
        role="region"
        aria-label="Scrollable coding activity heatmap timeline"
      >
        <div
          className="grid select-none"
          style={{
            gridTemplateColumns: `repeat(${weeks}, minmax(13px, 1fr))`,
            gridTemplateRows: "repeat(7, 13px) auto",
            gap: "3px",
            minWidth: `${weeks * 16}px`,
            width: weeks <= 53 ? "100%" : `${weeks * 16}px`,
          }}
        >
          {rows.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <span
                key={cell.date}
                onMouseEnter={() =>
                  setHover(cell.day ?? { date: cell.date, count: 0, solved: 0, byPlatform: [] })
                }
                onMouseLeave={() => setHover(null)}
                className="size-full rounded-[2px] transition-transform hover:scale-125"
                style={{
                  gridColumn: colIndex + 1,
                  gridRow: rowIndex + 1,
                  backgroundColor: cell.future
                    ? "transparent"
                    : LEVEL_BG[level(cell.day?.count ?? 0)],
                }}
              />
            )),
          )}

          {/* Month labels placed beneath the squares (matching Image 3) */}
          {months.map((m) => (
            <span
              key={`${m.label}-${m.index}`}
              className="pt-1 text-[10px] leading-none text-muted-foreground whitespace-nowrap"
              style={{ gridColumn: m.index + 1, gridRow: 8 }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer with hover tooltip breakdown & intensity legend */}
      <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="mr-auto">
          {hover ? (
            <span className="text-foreground">
              {formatDate(hover.date)} · {hover.count}{" "}
              {hover.count === 1 ? "activity" : "activities"}
              {hover.byPlatform.length > 0 ? (
                <span className="text-muted-foreground">
                  {" — "}
                  {hover.byPlatform
                    .map((b) => `${CODING_PLATFORM_LABEL[b.platform] ?? b.platform} ${b.count}`)
                    .join(" · ")}
                </span>
              ) : null}
            </span>
          ) : (
            "Hover a day for the platform breakdown"
          )}
        </span>
        <span className="flex items-center gap-1">
          Less
          {LEVEL_BG.map((bg, i) => (
            <span key={i} className="size-[10px] rounded-[2px]" style={{ backgroundColor: bg }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
