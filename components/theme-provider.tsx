"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

const THEME_KEY = "taos-theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable — fall through to media query
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_KEY, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_KEY, callback);
  };
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore reads localStorage/matchMedia as an external store and
  // reconciles client value after hydration without a setState-in-effect.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  const toggle = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore — theme still applies for the session
    }
    window.dispatchEvent(new Event(THEME_KEY));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
