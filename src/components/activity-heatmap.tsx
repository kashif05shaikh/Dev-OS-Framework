import { useMemo } from "react";

import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function key(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** GitHub-style contribution grid: 53 weeks x 7 days ending today. */
export function ActivityHeatmap({
  activity,
  color,
  weeks = 27,
  className,
}: {
  activity: Record<string, number>;
  color: string;
  weeks?: number;
  className?: string;
}) {
  const { columns, months, total, active } = useMemo(() => {
    const today = new Date();
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    // Walk back to the most recent Sunday so each column is a full week.
    const endOfWeek = new Date(end.getTime() + (6 - end.getUTCDay()) * DAY);
    const start = new Date(endOfWeek.getTime() - (weeks * 7 - 1) * DAY);

    const cols: { date: string; count: number; future: boolean }[][] = [];
    const monthLabels: { index: number; label: string }[] = [];
    let seenMonth = -1;
    let total = 0;
    let active = 0;

    for (let w = 0; w < weeks; w += 1) {
      const column: { date: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY);
        const id = key(date);
        const count = activity[id] ?? 0;
        total += count;
        if (count > 0) active += 1;
        column.push({ date: id, count, future: date.getTime() > end.getTime() });
        if (d === 0) {
          const month = date.getUTCMonth();
          if (month !== seenMonth) {
            seenMonth = month;
            monthLabels.push({ index: w, label: MONTHS[month]! });
          }
        }
      }
      cols.push(column);
    }
    return { columns: cols, months: monthLabels, total, active };
  }, [activity, weeks]);

  const max = useMemo(
    () => Math.max(1, ...Object.values(activity).map((n) => Number(n) || 0)),
    [activity],
  );

  const intensity = (count: number): number => {
    if (count <= 0) return 0;
    const ratio = count / max;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 0.75;
    if (ratio > 0.12) return 0.5;
    return 0.3;
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{total}</span> submissions
        </span>
        <span>
          <span className="font-semibold text-foreground">{active}</span> active days
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="relative mb-0.5 h-3">
            {months.map((m) => (
              <span
                key={`${m.label}-${m.index}`}
                className="absolute text-[9px] text-muted-foreground"
                style={{ left: `${m.index * 10}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[2px]">
            {columns.map((column, i) => (
              <div key={i} className="flex flex-col gap-[2px]">
                {column.map((cell) => {
                  const alpha = intensity(cell.count);
                  return (
                    <span
                      key={cell.date}
                      title={`${cell.count} on ${cell.date}`}
                      className="size-2 rounded-[2px]"
                      style={{
                        backgroundColor: cell.future
                          ? "transparent"
                          : alpha === 0
                            ? "color-mix(in srgb, var(--muted) 70%, transparent)"
                            : `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
