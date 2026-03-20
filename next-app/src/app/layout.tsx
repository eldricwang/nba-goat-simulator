import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOAT — NBA Greatest Of All Time",
  description: "NBA 历史球星数据对比工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="relative min-h-full flex flex-col text-slate-800">
        {children}
      </body>
    </html>
  );
}
