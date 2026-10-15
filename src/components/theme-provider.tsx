"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pulseboard.theme";
const THEME_CHANGE_EVENT = "pulseboard:theme-change";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Inline script that runs before first paint.
 *
 * Without it the server markup is always light and the browser repaints to
 * dark after hydration — the "theme flash". Reading `localStorage`
 * synchronously in `<head>` is the only way to avoid that, so this stays a
 * deliberately tiny, dependency-free string.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || ((!stored || stored === "system") && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {
    /* Storage can throw in private modes; light is a safe default. */
  }
})();
`.trim();

/* ---------------------------------------------------------------------------
   The theme lives in two places the React tree does not own: `localStorage`
   and the OS colour-scheme media query. That makes it an *external store*,
   so it is read with `useSyncExternalStore` rather than mirrored into state
   inside an effect. Mirroring would mean rendering the wrong theme once and
   then correcting it, and would trip React's own "no setState in an effect"
   guidance.
--------------------------------------------------------------------------- */

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* Storage unavailable (private mode, blocked cookies). */
  }
  return "system";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  // `storage` keeps other tabs in step; the custom event covers this tab,
  // because `storage` does not fire for the writer.
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

// Snapshots are strings, so React can compare them by value and never sees a
// new object identity on every render.
const getPreferenceSnapshot = (): ThemePreference => readPreference();
const getServerPreferenceSnapshot = (): ThemePreference => "system";

const getResolvedSnapshot = (): ResolvedTheme => {
  const preference = readPreference();
  if (preference !== "system") return preference;
  return prefersDark() ? "dark" : "light";
};
const getServerResolvedSnapshot = (): ResolvedTheme => "light";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribe,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  );
  const resolved = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    getServerResolvedSnapshot,
  );

  // Writing the class onto <html> is a side effect on an external system,
  // which is exactly what an effect is for.
  //
  // The store is re-read here rather than using the `resolved` value from the
  // render that scheduled this effect. During hydration React renders with
  // `getServerResolvedSnapshot()` ("light") to match the server HTML, so the
  // effect from that first commit would otherwise strip the `dark` class the
  // pre-paint bootstrap had already applied — a visible flash to light.
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      getResolvedSnapshot() === "dark",
    );
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* Preference simply won't persist; the session still works. */
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme() must be used inside <ThemeProvider>");
  }
  return context;
}
