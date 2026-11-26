import type { Metadata } from "next";
import { Inter, Noto_Sans_Georgian } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-georgian" });

export const metadata: Metadata = {
  title: "Tsevedi admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${inter.variable} ${georgian.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
