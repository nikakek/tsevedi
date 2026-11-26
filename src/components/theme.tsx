"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { useHydrated } from "@/lib/use-hydrated";

export type Theme = "light" | "dark";
const STORAGE_KEY = "theme";
const CHANGE_EVENT = "tsevedi-theme";

/**
 * Inline script for <head>: applies the saved theme before the first paint so there is no flash.
 * Visitors who never chose a theme start with their system's preference.
 */
const script = `(function(){try{var c=localStorage.getItem("${STORAGE_KEY}");var d=c?c==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function currentTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Keeps <html data-theme> in place. Switching language re-renders the root layout, and React
 * resets <html>'s attributes to the server version, which has no theme. This puts it back before paint.
 */
export function ThemeSync({ locale }: { locale: string }) {
  useLayoutEffect(() => {
    apply(currentTheme());
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      if (!html.dataset.theme) apply(currentTheme());
    });
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}

const subscribe = (notify: () => void) => {
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
};

/** Switches between light and dark and remembers the choice. */
export function ThemeToggle({ labels }: { labels: { toLight: string; toDark: string } }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as const);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? labels.toDark : labels.toLight;
  const hydrated = useHydrated();

  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={() => {
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {}
        apply(next);
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }}
      className="border-line-strong bg-surface text-ink hover:border-line-hover hover:bg-hover flex size-11 shrink-0 items-center justify-center rounded-full border disabled:cursor-default"
      aria-label={label}
      title={label}
    >
      {/* Both icons render; CSS shows the right one, so the server-rendered button never mismatches. */}
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}
