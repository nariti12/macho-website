import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

import { Suspense } from "react";

import { siteUrl } from "@/lib/seo";
import { GoogleAnalytics } from "@/components/google-analytics";
import { GoogleTagManager } from "@/components/google-tag-manager";
import { ScrollProgress } from "@/components/scroll-progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "マチョ田の部屋",
    template: "%s｜マチョ田の部屋",
  },
  description: "筋トレの悩みを解決する統合プラットフォーム。用途別最強筋トレメニューやおすすめ情報をお届けします。",
  metadataBase: new URL(siteUrl),
  alternates: {
    languages: {
      ja: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "マチョ田の部屋",
    description: "筋トレの悩みを解決する統合プラットフォーム。用途別最強筋トレメニューやおすすめ情報をお届けします。",
    siteName: "マチョ田の部屋",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: new URL("/picture/man.png", siteUrl).toString(),
        width: 800,
        height: 800,
        alt: "マチョ田のキャラクター",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "マチョ田の部屋",
    description: "筋トレの悩みを解決する統合プラットフォーム。用途別最強筋トレメニューやおすすめ情報をお届けします。",
    images: [new URL("/picture/man.png", siteUrl).toString()],
  },
  icons: {
    icon: new URL("/picture/ore.png", siteUrl).toString(),
    shortcut: new URL("/picture/ore.png", siteUrl).toString(),
    apple: new URL("/picture/ore.png", siteUrl).toString(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleTagManager />
        <ScrollProgress />
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <main className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
          {children}
        </main>
        <footer className="bg-[#FCC081] py-10 text-center text-sm text-white">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4">
            <p className="font-semibold text-white">@machoda</p>
            <span className="hidden h-4 w-px bg-white/40 sm:block" aria-hidden="true" />
            <Link
              href="/privacy"
              className="underline-offset-4 text-white transition hover:text-[#FFE7C2] hover:underline"
            >
              プライバシーポリシー
            </Link>
            <span className="hidden h-4 w-px bg-white/40 sm:block" aria-hidden="true" />
            <Link
              href="/contact"
              className="underline-offset-4 text-white transition hover:text-[#FFE7C2] hover:underline"
            >
              お問合せ
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
