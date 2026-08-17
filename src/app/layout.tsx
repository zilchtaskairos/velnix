import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Velnix — Anime, Manga & More",
  description:
    "Velnix is a premium mobile-first anime platform: discover, watch, read manga, and connect — all in one place.",
  applicationName: "Velnix",
  keywords: ["anime", "streaming", "manga", "velnix", "watch anime"],
  authors: [{ name: "Velnix" }],
  metadataBase: new URL(process.env.VELNIX_PUBLIC_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
