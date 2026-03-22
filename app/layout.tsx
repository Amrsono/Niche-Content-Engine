import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Niche Content Engine",
  description: "Autonomous AI-powered content generation for niche blogs.",
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
          {process.env.NEXT_PUBLIC_ADSENSE_PUB_ID && (
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
              crossOrigin="anonymous"
            />
          )}
        </head>
        <body>
          {children}
          <Analytics />
        </body>

      </html>
    </ClerkProvider>
  );
}
