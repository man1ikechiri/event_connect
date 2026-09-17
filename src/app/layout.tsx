import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/layout/cookie-banner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EventConnect — Run every side of your event, in one place",
    template: "%s · EventConnect",
  },
  description:
    "EventConnect connects organizers, speakers, attendees, and partners around a single event — invites, content, private Q&A, and moderation, all in one platform.",
  applicationName: "EventConnect",
  icons: {
    icon: "/icon",
    shortcut: "/icon",
  },
  openGraph: {
    type: "website",
    siteName: "EventConnect",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
