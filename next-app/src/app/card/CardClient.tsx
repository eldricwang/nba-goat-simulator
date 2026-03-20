"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShareCard, { type CardLang } from "@/components/ShareCard";
import NBALogo from "@/components/NBALogo";
import { getPlayerById, getPlayerSeason } from "@/lib/data";
import type { CompareMode } from "@/lib/types";
import { toPng } from "html-to-image";

export default function CardClient() {
  const searchParams = useSearchParams();

  // Read players & mode from URL
  const playerA = useMemo(
    () => getPlayerById(searchParams.get("a") ?? ""),
    [searchParams]
  );
  const playerB = useMemo(
    () => getPlayerById(searchParams.get("b") ?? ""),
    [searchParams]
  );
  const mode: CompareMode =
    (searchParams.get("mode") as CompareMode) || "career";
  const seasonA = searchParams.get("sa") ?? null;
  const seasonB = searchParams.get("sb") ?? null;

  const seasonDataA = useMemo(
    () => (playerA && seasonA ? getPlayerSeason(playerA.id, seasonA) : undefined),
    [playerA, seasonA]
  );
  const seasonDataB = useMemo(
    () => (playerB && seasonB ? getPlayerSeason(playerB.id, seasonB) : undefined),
    [playerB, seasonB]
  );

  // Card state
  const [cardLang, setCardLang] = useState<CardLang>("zh");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: 1080,
        height: 1350,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `GOAT_${playerA?.nameEn ?? "A"}_vs_${playerB?.nameEn ?? "B"}_${cardLang}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate PNG:", err);
    } finally {
      setDownloading(false);
    }
  }, [playerA, playerB, cardLang]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // Build /compare URL with same params
  const compareUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (playerA) params.set("a", playerA.id);
    if (playerB) params.set("b", playerB.id);
    params.set("mode", mode);
    if (mode === "season") {
      if (seasonA) params.set("sa", seasonA);
      if (seasonB) params.set("sb", seasonB);
    }
    return `/compare?${params.toString()}`;
  }, [playerA, playerB, mode, seasonA, seasonB]);

  // Missing players fallback
  if (!playerA || !playerB) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <NBALogo className="h-12 mb-6" />
        <h2 className="text-xl font-bold mb-2">
          {!playerA && !playerB ? "未指定球员" : "缺少一名球员"}
        </h2>
        <p className="text-white/50 text-sm mb-8">
          请通过对比页面生成分享链接
        </p>
        <Link
          href="/compare"
          className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-all"
        >
          前往对比页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5">
        <Link href={compareUrl} className="flex items-center gap-2 group">
          <svg
            className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <NBALogo className="h-8" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Player profile links */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <Link
              href={`/player/${playerA.id}`}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {playerA.nameZh}
            </Link>
            <span className="text-white/20 text-xs">vs</span>
            <Link
              href={`/player/${playerB.id}`}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {playerB.nameZh}
            </Link>
          </div>
          {/* Language toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/15">
            <button
              onClick={() => setCardLang("zh")}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all"
              style={{
                background:
                  cardLang === "zh" ? "rgba(255,255,255,0.15)" : "transparent",
                color:
                  cardLang === "zh" ? "white" : "rgba(255,255,255,0.4)",
              }}
            >
              中文
            </button>
            <button
              onClick={() => setCardLang("en")}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all"
              style={{
                background:
                  cardLang === "en" ? "rgba(255,255,255,0.15)" : "transparent",
                color:
                  cardLang === "en" ? "white" : "rgba(255,255,255,0.4)",
              }}
            >
              EN
            </button>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all border"
            style={{
              background: copied ? "rgba(34,197,94,0.15)" : "transparent",
              borderColor: copied
                ? "rgba(34,197,94,0.4)"
                : "rgba(255,255,255,0.15)",
              color: copied ? "#4ade80" : "rgba(255,255,255,0.7)",
            }}
          >
            {copied ? "已复制" : "复制链接"}
          </button>

          {/* Download */}
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-white text-xs sm:text-sm shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #C8102E, #1D428A)",
            }}
          >
            {downloading ? "生成中..." : "下载 PNG"}
          </button>
        </div>
      </header>

      {/* Card area */}
      <main className="flex-1 flex items-start justify-center overflow-auto py-6 sm:py-10">
        <div
          className="origin-top"
          style={{
            transform: "scale(var(--card-scale, 0.4))",
            marginBottom: `calc(-1350px * (1 - var(--card-scale, 0.4)))`,
          }}
        >
          <style>{`
            :root {
              --card-scale: 0.35;
            }
            @media (min-width: 640px) {
              :root { --card-scale: 0.45; }
            }
            @media (min-width: 768px) {
              :root { --card-scale: 0.55; }
            }
            @media (min-width: 1024px) {
              :root { --card-scale: 0.65; }
            }
            @media (min-width: 1280px) {
              :root { --card-scale: 0.75; }
            }
          `}</style>
          <ShareCard
            ref={cardRef}
            playerA={playerA}
            playerB={playerB}
            mode={mode}
            lang={cardLang}
            seasonDataA={seasonDataA}
            seasonDataB={seasonDataB}
            seasonLabelA={seasonA}
            seasonLabelB={seasonB}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3">
        <div className="flex items-center justify-between px-4 sm:px-8 text-[11px] text-white/20">
          <p>GOAT — Greatest Of All Time Comparator</p>
          <nav className="flex gap-4">
            <Link href="/compare" className="hover:text-white/50 transition-colors">对比</Link>
            <Link href="/players" className="hover:text-white/50 transition-colors">球员</Link>
            <Link href="/about" className="hover:text-white/50 transition-colors">关于</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
