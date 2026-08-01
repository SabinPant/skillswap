// app/layout.tsx
// Root layout — loads the three-font stack via next/font/google,
// exposes them as CSS variables consumed by globals.css @theme blocks,
// and wraps the app in TanStack Query's QueryClientProvider.
//
// QueryClient is created once via useState so it survives re-renders
// and doesn't get recreated on every route change.

import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillSwap — Trade skills, not money",
  description:
    "A peer-to-peer marketplace where people exchange skills instead of cash. Teach what you know, learn what you want.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-surface-warm-50 font-body text-surface-ink-800">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
