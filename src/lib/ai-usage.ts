import { useCallback, useEffect, useState } from "react";

export type AiUsage = { count: number; lastUsedAt: string };
export type AiWorkspaceState = {
  favorites: string[];
  usage: Record<string, AiUsage>;
};

const KEY = "devos.ai-workspace";
const EMPTY: AiWorkspaceState = { favorites: [], usage: {} };

function read(): AiWorkspaceState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AiWorkspaceState>;
    return { favorites: parsed.favorites ?? [], usage: parsed.usage ?? {} };
  } catch {
    return EMPTY;
  }
}

/** Locally persisted favourites + usage counters for the AI workspace. */
export function useAiWorkspace() {
  const [state, setState] = useState<AiWorkspaceState>(EMPTY);

  useEffect(() => setState(read()), []);

  const persist = useCallback((next: AiWorkspaceState) => {
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  }, []);

  const toggleFavorite = useCallback(
    (id: string) =>
      setState((prev) => {
        const favorites = prev.favorites.includes(id)
          ? prev.favorites.filter((f) => f !== id)
          : [...prev.favorites, id];
        const next = { ...prev, favorites };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  const recordUse = useCallback(
    (id: string) =>
      setState((prev) => {
        const current = prev.usage[id];
        const next: AiWorkspaceState = {
          ...prev,
          usage: {
            ...prev.usage,
            [id]: { count: (current?.count ?? 0) + 1, lastUsedAt: new Date().toISOString() },
          },
        };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  return { state, persist, toggleFavorite, recordUse };
}

/** "Today 10:35 AM" / "Yesterday 9:15 AM" / "12 Mar 2026". */
export function formatLastUsed(iso?: string): string {
  if (!iso) return "Never opened";
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
