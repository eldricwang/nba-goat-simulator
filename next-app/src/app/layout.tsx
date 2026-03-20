import type { Metadata } from "next";
import { webSiteJsonLd, JsonLdScripts } from "@/lib/jsonld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nba-goat.vercel.app"),
  title: {
    default: "GOAT — NBA Greatest Of All Time",
    template: "%s | GOAT",
  },
  description:
    "NBA 历史球星数据对比工具 — 800+ 名球员生涯数据对比、6700+ 个赛季单赛季分析，支持分享卡片生成。",
  keywords: [
    "NBA",
    "球员对比",
    "GOAT",
    "NBA 数据",
    "NBA stats",
    "篮球数据",
    "生涯数据",
    "赛季数据",
  ],
  authors: [{ name: "GOAT Team" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "GOAT — NBA Greatest Of All Time",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="relative min-h-full flex flex-col text-slate-800">
        <JsonLdScripts data={webSiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
