import type { Metadata } from "next";
import { ThemeSync } from "@/components/theme";
import Script from "next/script";
import { themeScript } from "@/lib/theme-script";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Tsevedi admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Script
          id="theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeSync locale="en" />
        {children}
      </body>
    </html>
  );
}
