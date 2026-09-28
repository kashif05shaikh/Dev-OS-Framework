export type AccentKey =
  | "violet"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan";

export type AccentOption = {
  key: AccentKey;
  label: string;
  /** oklch chroma/hue used for --primary, --ring and --sidebar-primary. */
  primary: string;
  swatch: string;
};

export const ACCENTS: AccentOption[] = [
  { key: "violet", label: "Violet", primary: "oklch(0.63 0.21 293)", swatch: "#8b5cf6" },
  { key: "blue", label: "Blue", primary: "oklch(0.62 0.18 255)", swatch: "#3b82f6" },
  { key: "emerald", label: "Emerald", primary: "oklch(0.68 0.16 162)", swatch: "#10b981" },
  { key: "amber", label: "Amber", primary: "oklch(0.76 0.16 70)", swatch: "#f59e0b" },
  { key: "rose", label: "Rose", primary: "oklch(0.64 0.2 15)", swatch: "#f43f5e" },
  { key: "cyan", label: "Cyan", primary: "oklch(0.7 0.13 210)", swatch: "#06b6d4" },
];

export const DEFAULT_ACCENT: AccentKey = "violet";

export function resolveAccent(value: string | null | undefined): AccentOption {
  return ACCENTS.find((a) => a.key === value) ?? ACCENTS[0]!;
}

/** Paint the chosen accent onto the live CSS custom properties. */
export function applyAccent(value: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const accent = resolveAccent(value);
  const root = document.documentElement;
  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--ring", accent.primary);
  root.style.setProperty("--sidebar-primary", accent.primary);
  root.style.setProperty("--sidebar-ring", accent.primary);
  root.style.setProperty("--chart-1", accent.primary);
}

const STORAGE_KEY = "devos.accent";

export function cacheAccent(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

export function cachedAccent(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}