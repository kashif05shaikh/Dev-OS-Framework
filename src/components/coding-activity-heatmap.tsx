import { useMemo, useState } from "react";

import type { CombinedDay } from "@/lib/coding-activity";
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

/** One combined GitHub-style grid for the last ~12 months of coding activity. */
export function CodingActivityHeatmap({
  days,
  className,
}: {
  days: Map<string, CombinedDay>;
  className?: string;
}) {
  const [hover, setHover] = useState<CombinedDay | null>(null);

  const { rows, months } = useMemo(() => {
    const now = new Date();
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endOfWeek = end + (6 - new Date(end).getUTCDay()) * DAY;
    const weeks = 53;
    const start = endOfWeek - (weeks * 7 - 1) * DAY;

    const columns: { date: string; day: CombinedDay | null; future: boolean }[][] = [];
    const labels: { index: number; label: string }[] = [];
    let seen = -1;

    for (let w = 0; w < weeks; w += 1) {
      const column: { date: string; day: CombinedDay | null; future: boolean }[] = [];
      for (let d = 0; d < 7; d += 1) {
        const ms = start + (w * 7 + d) * DAY;
        const id = key(ms);
        column.push({ date: id, day: days.get(id) ?? null, future: ms > end });
        if (d === 0) {
          const month = new Date(ms).getUTCMonth();
          if (month !== seen) {
            seen = month;
            labels.push({ index: w, label: MONTHS[month]! });
          }
        }
      }
      columns.push(column);
    }

    const rows: (typeof columns)[number][] = [];
    for (let d = 0; d < 7; d += 1) {
      rows.push(columns.map((col) => col[d]!));
    }

    return { rows, months: labels };
  }, [days]);

  return (
    <div className={cn("relative", className)}>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: "repeat(53, minmax(0, 1fr))",
          gridTemplateRows: "auto repeat(7, 1fr)",
          gap: "3px",
        }}
      >
        {months.map((m) => (
          <span
            key={`${m.label}-${m.index}`}
            className="text-[10px] leading-none text-muted-foreground"
            style={{ gridColumn: m.index + 1, gridRow: 1 }}
          >
            {m.label}
          </span>
        ))}

        {rows.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <span
              key={cell.date}
              onMouseEnter={() =>
                setHover(cell.day ?? { date: cell.date, count: 0, solved: 0, byPlatform: [] })
              }
              onMouseLeave={() => setHover(null)}
              className="aspect-square w-full min-w-0 rounded-[2px] transition-transform hover:scale-125"
              style={{
                gridColumn: colIndex + 1,
                gridRow: rowIndex + 2,
                backgroundColor: cell.future
                  ? "transparent"
                  : LEVEL_BG[level(cell.day?.count ?? 0)],
              }}
            />
          )),
        )}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="mr-auto">
          {hover ? (
            <span className="text-foreground">
              {formatDate(hover.date)} · {hover.count} {hover.count === 1 ? "activity" : "activities"}
              {hover.byPlatform.length > 0 ? (
                <span className="text-muted-foreground">
                  {" — "}
                  {hover.byPlatform
                    .map(
                      (b) =>
                        `${CODING_PLATFORM_LABEL[b.platform] ?? b.platform} ${b.count}`,
                    )
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
