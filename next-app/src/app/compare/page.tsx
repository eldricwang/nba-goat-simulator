import { Suspense } from "react";
import { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "NBA 球员数据对比",
  description:
    "对比 NBA 历史球员的生涯数据和单赛季表现。支持 800+ 名球员、6700+ 个赛季的多维度数据对比。",
  openGraph: {
    title: "NBA 球员数据对比",
    description:
      "对比 NBA 历史球员的生涯数据和单赛季表现。支持 800+ 名球员、6700+ 个赛季的多维度数据对比。",
    type: "website",
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="text-white/30">Loading...</div>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
