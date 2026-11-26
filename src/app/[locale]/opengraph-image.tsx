import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tsevedi: marshrutkas and shared rides across Georgia";

/** Social preview. Latin text only: the default OG font has no Georgian glyphs. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f5f2", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#d0202a" />
            <path d="M14 44c8-2 10-10 18-12s12-6 18-14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
            <circle cx="14" cy="44" r="5" fill="#fff" />
            <circle cx="50" cy="18" r="5" fill="#fff" />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 700, color: "#1c1917" }}>Tsevedi</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: "#1c1917", lineHeight: 1.1 }}>Marshrutkas across Georgia</span>
          <span style={{ fontSize: 36, color: "#6b6560" }}>Times, prices and drivers&apos; phone numbers for towns and villages. Free.</span>
        </div>
        <span style={{ fontSize: 30, color: "#d0202a", fontWeight: 600 }}>tsevedi.ge</span>
      </div>
    ),
    size,
  );
}
