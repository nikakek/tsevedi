"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";
const STORAGE_KEY = "theme";

/**
 * Inline script for <head>: applies the saved or system theme before the first paint,
 * so dark-mode visitors never see a white flash.
 */
const script = `(function(){try{var c=localStorage.getItem("${STORAGE_KEY}");var d=c==="dark"||(c!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function readChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function apply(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const ICONS = { system: Monitor, light: Sun, dark: Moon };

/** Cycles system → light → dark. */
const CHANGE_EVENT = "tsevedi-theme";
const subscribe = (notify: () => void) => {
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
};

export function ThemeToggle({ labels }: { labels: Record<ThemeChoice, string> }) {
  // The saved choice lives in localStorage; on the server it is always "system".
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as const);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readChoice() === "system" && apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const current = choice;
  const Icon = ICONS[current];
  return (
    <button
      type="button"
      onClick={() => {
        const next = NEXT[current];
        try {
          if (next === "system") localStorage.removeItem(STORAGE_KEY);
          else localStorage.setItem(STORAGE_KEY, next);
        } catch {}
        apply(next);
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }}
      className="border-line-strong bg-surface text-ink hover:border-line-hover hover:bg-hover flex size-11 shrink-0 items-center justify-center rounded-full border"
      aria-label={labels[current]}
      title={labels[current]}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}
