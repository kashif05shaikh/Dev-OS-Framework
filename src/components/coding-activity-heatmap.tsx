import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  calculateCodingStreaks,
  type CombinedDay,
} from "@/lib/coding-activity";
import { CODING_PLATFORM_LABEL } from "@/lib/devos-types";
import { cn } from "@/lib/utils";

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

export type CodingActivityHeatmapProps = {
  days: Map<string, CombinedDay>;
  submissions?: number;
  maxStreak?: number;
  currentStreak?: number;
  className?: string;
};

/**
 * Interactive coding activity heatmap with perfectly square static day boxes
 * and smooth horizontal scrolling from the user's first submission till date.
 */
export function CodingActivityHeatmap({
  days,
  submissions,
  maxStreak,
  currentStreak,
  className,
}: CodingActivityHeatmapProps) {
  const [hover, setHover] = useState<CombinedDay | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Compute the full timeline from the earliest recorded submission to today
  const { columns, months, weeks, totalSubmissions, calculatedMaxStreak, calculatedCurrentStreak } =
    useMemo(() => {
      const now = new Date();
      const todayEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const endOfWeek = todayEnd + (6 - new Date(todayEnd).getUTCDay()) * DAY;

      // Earliest submission date across all verified platforms
      const activeDates = Array.from(days.entries())
        .filter(([_, d]) => d.count > 0)
        .map(([date]) => date)
        .sort();

      const earliestDate = activeDates[0] ?? null;

      // Default to 53 weeks (1 year) or extend back to earliest submission
      const min53WeeksStart = endOfWeek - (53 * 7 - 1) * DAY;
      let rangeStartMs = min53WeeksStart;

      if (earliestDate) {
        const earliestMs = Date.parse(`${earliestDate}T00:00:00Z`);
        const earliestWeekStart = earliestMs - new Date(earliestMs).getUTCDay() * DAY;
        rangeStartMs = Math.min(earliestWeekStart, min53WeeksStart);
      }

      const totalWeeks = Math.max(53, Math.round((endOfWeek - rangeStartMs + DAY) / (7 * DAY)));

      const cols: { date: string; day: CombinedDay | null; future: boolean }[][] = [];
      const monthLabels: { index: number; label: string }[] = [];
      let seenMonth = -1;
      let seenYear = -1;

      let subCount = 0;
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
            subCount += dayData.count;
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
                totalWeeks > 56 && m === 0 ? `${MONTHS[m]} '${String(y).slice(2)}` : MONTHS[m]!;
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
        totalSubmissions: subCount,
        calculatedMaxStreak: streaks.maxStreak,
        calculatedCurrentStreak: streaks.currentStreak,
      };
    }, [days]);

  const rows = useMemo(() => {
    const r: (typeof columns)[number][] = [];
    for (let d = 0; d < 7; d += 1) {
      r.push(columns.map((col) => col[d]!));
    }
    return r;
  }, [columns]);

  // Automatically scroll to the right edge (most recent activity) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  const scrollToStart = () => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scrollToEnd = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }
  };

  const displaySubmissions = submissions !== undefined ? submissions : totalSubmissions;
  const displayMaxStreak = maxStreak !== undefined ? maxStreak : calculatedMaxStreak;
  const displayCurrentStreak = currentStreak !== undefined ? currentStreak : calculatedCurrentStreak;

  return (
    <div className={cn("relative flex flex-col", className)}>
      {/* Top Header Stats & Quick Jump Controls */}
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

        {/* Sideways Quick Scroll Jump Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">Scroll timeline</span>
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

      {/* Sideways Scrollable Heatmap with Visible Horizontal Scrollbar below */}
      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto overflow-y-hidden pb-3 pt-1 scrollbar-thin scrollbar-track-white/[0.03] scrollbar-thumb-white/20 hover:scrollbar-thumb-white/35"
        tabIndex={0}
        role="region"
        aria-label="Scrollable coding activity heatmap timeline"
      >
        <div
          className="grid select-none"
          style={{
            gridTemplateColumns: `repeat(${weeks}, 12px)`,
            gridTemplateRows: "repeat(7, 12px) auto",
            gap: "3px",
            width: "max-content",
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
                className="size-[12px] rounded-[2px] shrink-0 transition-transform hover:scale-125"
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

          {/* Month labels placed beneath the squares */}
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
