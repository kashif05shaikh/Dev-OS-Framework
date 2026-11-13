import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  calculateCodingStreaks,
  type CombinedDay,
} from "@/lib/coding-activity";
import { CODING_PLATFORM_LABEL } from "@/lib/devos-types";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function key(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const LEVEL_CONFIG = [
  // Level 0: No activity - crisp slate-gray tile with distinct border so empty days are clearly visible
  {
    bg: "#27272a",
    border: "#3a3d45",
    label: "0 submissions",
  },
  // Level 1: Low activity (1-2) - deep forest green
  {
    bg: "#0e4429",
    border: "#165835",
    label: "1-2 submissions",
  },
  // Level 2: Medium activity (3-5) - rich emerald green
  {
    bg: "#006d32",
    border: "#0f8546",
    label: "3-5 submissions",
  },
  // Level 3: High activity (6-9) - vibrant emerald green
  {
    bg: "#26a641",
    border: "#30ba4d",
    label: "6-9 submissions",
  },
  // Level 4: Peak activity (10+) - bright luminous lime green
  {
    bg: "#39d353",
    border: "#56e36d",
    label: "10+ submissions",
  },
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

const GAP = 3;
const MONTH_GAP = 18;
const MIN_SQUARE_SIZE = 18;

/**
 * Interactive coding activity heatmap with month-wise separated blocks,
 * high-contrast color grading, and smooth horizontal scrolling.
 */
export function CodingActivityHeatmap({
  days,
  submissions,
  maxStreak,
  currentStreak,
  className,
}: CodingActivityHeatmapProps) {
  const [hover, setHover] = useState<CombinedDay | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Measure container width responsively
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    update();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Compute month-wise grouped timeline from earliest submission to today
  const {
    monthsData,
    totalColumns,
    totalSubmissions,
    calculatedMaxStreak,
    calculatedCurrentStreak,
  } = useMemo(() => {
    const now = new Date();
    const todayEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // Earliest submission date across all verified platforms
    const activeDates = Array.from(days.entries())
      .filter(([_, d]) => d.count > 0)
      .map(([date]) => date)
      .sort();

    const earliestDate = activeDates[0] ?? null;

    const endYear = now.getUTCFullYear();
    const endMonth = now.getUTCMonth(); // 0..11

    // Default to at least 12 months (or extend back to earliest recorded submission month)
    let startYear = endYear;
    let startMonth = endMonth - 11;
    if (startMonth < 0) {
      startYear -= 1;
      startMonth += 12;
    }

    if (earliestDate) {
      const parts = earliestDate.split("-");
      const ey = Number(parts[0]);
      const em = Number(parts[1]) - 1;
      if (!Number.isNaN(ey) && !Number.isNaN(em)) {
        if (ey < startYear || (ey === startYear && em < startMonth)) {
          startYear = ey;
          startMonth = em;
        }
      }
    }

    let subCount = 0;
    const activeDateSet = new Set<string>();

    type MonthCell = {
      date: string;
      col: number;
      row: number;
      day: CombinedDay | null;
      future: boolean;
    };

    type MonthGroup = {
      year: number;
      month: number;
      label: string;
      colCount: number;
      days: MonthCell[];
    };

    const groups: MonthGroup[] = [];
    let curY = startYear;
    let curM = startMonth;
    let sumCols = 0;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const daysInMonth = new Date(Date.UTC(curY, curM + 1, 0)).getUTCDate();
      const firstDayOfWeek = new Date(Date.UTC(curY, curM, 1)).getUTCDay(); // 0 (Sun) .. 6 (Sat)
      const colCount = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
      sumCols += colCount;

      const monthDays: MonthCell[] = [];

      for (let col = 0; col < colCount; col += 1) {
        for (let row = 0; row < 7; row += 1) {
          const dayNum = col * 7 + row - firstDayOfWeek + 1;
          if (dayNum >= 1 && dayNum <= daysInMonth) {
            const ms = Date.UTC(curY, curM, dayNum);
            const dateId = key(ms);
            const isFuture = ms > todayEnd;
            const dayData = days.get(dateId) ?? null;

            if (dayData && dayData.count > 0 && !isFuture) {
              subCount += dayData.count;
              activeDateSet.add(dateId);
            }

            monthDays.push({
              date: dateId,
              col,
              row,
              day: dayData,
              future: isFuture,
            });
          }
        }
      }

      // Add year to January label or whenever timeline spans years
      const label =
        curM === 0
          ? `${MONTHS[curM]} '${String(curY).slice(2)}`
          : MONTHS[curM]!;

      groups.push({
        year: curY,
        month: curM,
        label,
        colCount,
        days: monthDays,
      });

      curM += 1;
      if (curM > 11) {
        curM = 0;
        curY += 1;
      }
    }

    const streaks = calculateCodingStreaks(activeDateSet);

    return {
      monthsData: groups,
      totalColumns: sumCols,
      totalSubmissions: subCount,
      calculatedMaxStreak: streaks.maxStreak,
      calculatedCurrentStreak: streaks.currentStreak,
    };
  }, [days]);

  // Compute square size dynamically so that it fills container width gracefully or scrolls smoothly
  const squareSize = useMemo(() => {
    if (!containerWidth || totalColumns <= 0 || monthsData.length === 0) return MIN_SQUARE_SIZE;
    const totalMonthGaps = (monthsData.length - 1) * MONTH_GAP;
    const totalColGaps = (totalColumns - monthsData.length) * GAP;
    const available = containerWidth - totalMonthGaps - totalColGaps - 8;
    const sizeToFill = Math.floor(available / totalColumns);
    return Math.max(MIN_SQUARE_SIZE, Math.min(22, sizeToFill));
  }, [containerWidth, totalColumns, monthsData.length]);

  // Automatically scroll to the right edge (most recent activity) on mount / updates
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      });
    }
  }, [totalColumns, squareSize]);

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
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shadow-xs"
            title="Scroll to earliest submissions (first submission)"
            aria-label="Scroll to earliest submission"
          >
            <ChevronsLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={scrollToEnd}
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shadow-xs"
            title="Scroll to current submissions"
            aria-label="Scroll to current submission"
          >
            <ChevronsRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Sideways Scrollable Month-Wise Heatmap */}
      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto overflow-y-hidden pb-3 pt-1 scrollbar-thin scrollbar-track-white/[0.03] scrollbar-thumb-white/20 hover:scrollbar-thumb-white/35"
        tabIndex={0}
        role="region"
        aria-label="Scrollable coding activity heatmap timeline"
      >
        <div
          className="flex items-start select-none"
          style={{
            gap: `${MONTH_GAP}px`,
            width: "max-content",
            minWidth: "100%",
          }}
        >
          {monthsData.map((m) => {
            const monthWidth = m.colCount * squareSize + (m.colCount - 1) * GAP;
            return (
              <div
                key={`${m.year}-${m.month}`}
                className="flex flex-col items-center shrink-0"
                style={{ width: `${monthWidth}px` }}
              >
                {/* 7-row month grid */}
                <div
                  className="grid select-none"
                  style={{
                    gridTemplateColumns: `repeat(${m.colCount}, ${squareSize}px)`,
                    gridTemplateRows: `repeat(7, ${squareSize}px)`,
                    gap: `${GAP}px`,
                    width: `${monthWidth}px`,
                    height: `${7 * squareSize + 6 * GAP}px`,
                  }}
                >
                  {m.days.map((cell) => {
                    const lvl = level(cell.day?.count ?? 0);
                    const cfg = LEVEL_CONFIG[lvl]!;
                    return (
                      <span
                        key={cell.date}
                        onMouseEnter={() => {
                          if (!cell.future) {
                            setHover(
                              cell.day ?? { date: cell.date, count: 0, solved: 0, byPlatform: [] },
                            );
                          }
                        }}
                        onMouseLeave={() => setHover(null)}
                        className="rounded-[3.5px] shrink-0 transition-all hover:ring-1 hover:ring-foreground/50 hover:brightness-110"
                        style={{
                          gridColumn: cell.col + 1,
                          gridRow: cell.row + 1,
                          width: `${squareSize}px`,
                          height: `${squareSize}px`,
                          backgroundColor: cell.future ? "transparent" : cfg.bg,
                          border: cell.future ? "1px solid transparent" : `1px solid ${cfg.border}`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Centered month label placed underneath each month's block */}
                <span className="pt-2 text-[11px] leading-none text-muted-foreground whitespace-nowrap font-medium select-none text-center">
                  {m.label}
                </span>
              </div>
            );
          })}
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
        <span className="flex items-center gap-1.5 select-none">
          Less
          {LEVEL_CONFIG.map((cfg, i) => (
            <span
              key={i}
              className="size-3 rounded-[2.5px] shrink-0"
              style={{
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
              title={cfg.label}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
