import type { Metadata } from "next";
import { Suspense } from "react";
import CardClient from "./CardClient";
import { getPlayerById } from "@/lib/data";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const aId = params.a ?? "";
  const bId = params.b ?? "";
  const mode = params.mode ?? "career";

  const playerA = getPlayerById(aId);
  const playerB = getPlayerById(bId);

  const titleParts: string[] = [];
  if (playerA && playerB) {
    titleParts.push(
      `${playerA.nameZh} vs ${playerB.nameZh}`,
      mode === "career" ? "生涯对比" : `赛季对比`
    );
  }
  const title = titleParts.length
    ? `${titleParts.join(" — ")} | GOAT`
    : "GOAT — NBA 球星对比器";

  const description =
    playerA && playerB
      ? `${playerA.nameEn} vs ${playerB.nameEn} — ${mode === "career" ? "Career" : "Season"} comparison on GOAT Comparator`
      : "NBA 球星数据对比分享卡片";

  // Build OG image URL from search params
  const ogParams = new URLSearchParams();
  if (aId) ogParams.set("a", aId);
  if (bId) ogParams.set("b", bId);
  ogParams.set("mode", mode);
  if (mode === "season") {
    if (params.sa) ogParams.set("sa", params.sa);
    if (params.sb) ogParams.set("sb", params.sb);
  }
  const ogImagePath = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
  };
}

export default function CardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/40 text-sm">
          Loading...
        </div>
      }
    >
      <CardClient />
    </Suspense>
  );
}
