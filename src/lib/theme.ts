export type ThemeKey = "dark" | "light";

export const DEFAULT_THEME: ThemeKey = "dark";

const STORAGE_KEY = "devos.theme";

export function resolveTheme(value: string | null | undefined): ThemeKey {
  return value === "light" ? "light" : "dark";
}

/** Swap the root theme class. Dark is the default DevOS look. */
export function applyTheme(value: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const theme = resolveTheme(value);
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function cacheTheme(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

export function cachedTheme(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
