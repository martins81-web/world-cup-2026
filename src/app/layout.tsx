import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcup2026.example"),
  title: "World Cup 2026",
  description: "PostgreSQL-backed World Cup 2026 fixtures, standings, bracket, teams, squads and statistics.",
  openGraph: {
    title: "World Cup 2026",
    description: "Fixtures, standings, bracket, teams, squads and statistics for the 2026 World Cup.",
    type: "website"
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
