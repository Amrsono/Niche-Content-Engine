import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "./components/ThemeProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://niche-content-engine.vercel.app'),
  title: {
    default: "Niche Content Engine",
    template: "%s | Niche Content Engine"
  },
  description: "Autonomous AI-powered content generation for niche blogs.",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://niche-content-engine.vercel.app',
    siteName: 'Niche Content Engine',
  },
  facebook: {
    appId: process.env.NEXT_PUBLIC_FB_APP_ID || '2464563490653501',
  },
  other: {
    'debug-version': 'v5-facebook-priority-fix'
  },
  verification: {
    google: "j8CCN_dus6I_nlRXK38gHcVuQETYhAIDlA7PF8HY6hM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7376665839682546"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          <ThemeProvider>
            {children}
            <Analytics />
          </ThemeProvider>
        </body>

      </html>
    </ClerkProvider>
  );
}
