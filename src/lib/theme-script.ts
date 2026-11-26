import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Applies the saved theme (or the system preference for first-time visitors) before the first paint.
 * Root layouts load it with next/script's `beforeInteractive` strategy, so Next.js inlines it into the
 * server HTML and React never renders the <script> itself (which warns when the root layout
 * re-renders on a language switch).
 */
export const themeScript = `(function(){try{var c=localStorage.getItem("${THEME_STORAGE_KEY}");var d=c?c==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()`;
