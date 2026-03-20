"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Player, CompareMode } from "@/lib/types";
import {
  getAllPlayers,
  getPlayerById,
  getAvailableSeasons,
  getPlayerSeason,
} from "@/lib/data";
import PlayerSelect from "@/components/PlayerSelect";
import PlayerCard from "@/components/PlayerCard";
import CompareTable from "@/components/CompareTable";
import CompareSummary from "@/components/CompareSummary";
import ShareCard, { type CardLang } from "@/components/ShareCard";
import ModeToggle from "@/components/ModeToggle";
import SeasonSelect from "@/components/SeasonSelect";
import NBALogo from "@/components/NBALogo";
import Link from "next/link";
import { toPng } from "html-to-image";
import { analytics } from "@/lib/analytics";

export default function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const players = getAllPlayers();

  const [playerA, setPlayerA] = useState<Player | null>(() => {
    const id = searchParams.get("a");
    return id ? getPlayerById(id) ?? null : null;
  });
  const [playerB, setPlayerB] = useState<Player | null>(() => {
    const id = searchParams.get("b");
    return id ? getPlayerById(id) ?? null : null;
  });
  const [mode, setMode] = useState<CompareMode>(
    (searchParams.get("mode") as CompareMode) || "career"
  );
  const [seasonA, setSeasonA] = useState<string | null>(
    searchParams.get("sa")
  );
  const [seasonB, setSeasonB] = useState<string | null>(
    searchParams.get("sb")
  );

  const seasonsA = useMemo(
    () => (playerA ? getAvailableSeasons(playerA.id) : []),
    [playerA]
  );
  const seasonsB = useMemo(
    () => (playerB ? getAvailableSeasons(playerB.id) : []),
    [playerB]
  );

  // 页面浏览埋点
  useEffect(() => {
    analytics.pageView('compare');
  }, []);

  // 对比查看埋点
  useEffect(() => {
    if (playerA && playerB) {
      analytics.compareView(playerA.nameZh, playerB.nameZh, mode);
    }
  }, [playerA, playerB, mode]);

  useEffect(() => {
    if (mode === "season" && playerA && seasonsA.length > 0 && !seasonA) {
      setSeasonA(seasonsA[seasonsA.length - 1]);
    }
  }, [mode, playerA, seasonsA, seasonA]);

  useEffect(() => {
    if (mode === "season" && playerB && seasonsB.length > 0 && !seasonB) {
      setSeasonB(seasonsB[seasonsB.length - 1]);
    }
  }, [mode, playerB, seasonsB, seasonB]);

  const handleSelectA = (p: Player | null) => {
    setPlayerA(p);
    setSeasonA(null);
  };
  const handleSelectB = (p: Player | null) => {
    setPlayerB(p);
    setSeasonB(null);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (playerA) params.set("a", playerA.id);
    if (playerB) params.set("b", playerB.id);
    params.set("mode", mode);
    if (mode === "season") {
      if (seasonA) params.set("sa", seasonA);
      if (seasonB) params.set("sb", seasonB);
    }
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  }, [playerA, playerB, mode, seasonA, seasonB, router]);

  const seasonDataA = useMemo(
    () =>
      playerA && seasonA ? getPlayerSeason(playerA.id, seasonA) : undefined,
    [playerA, seasonA]
  );
  const seasonDataB = useMemo(
    () =>
      playerB && seasonB ? getPlayerSeason(playerB.id, seasonB) : undefined,
    [playerB, seasonB]
  );

  // Share card state
  const [showCard, setShowCard] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cardLang, setCardLang] = useState<CardLang>("zh");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Track origin after mount to avoid hydration mismatch
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Build /card share URL
  const cardShareUrl = useMemo(() => {
    if (!playerA || !playerB) return "";
    const params = new URLSearchParams();
    params.set("a", playerA.id);
    params.set("b", playerB.id);
    params.set("mode", mode);
    if (mode === "season") {
      if (seasonA) params.set("sa", seasonA);
      if (seasonB) params.set("sb", seasonB);
    }
    return `${origin}/card?${params.toString()}`;
  }, [playerA, playerB, mode, seasonA, seasonB, origin]);

  const handleCopyCardLink = useCallback(async () => {
    if (!cardShareUrl) return;
    try {
      await navigator.clipboard.writeText(cardShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = cardShareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [cardShareUrl]);

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

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/compare">
              <NBALogo className="h-8 sm:h-10" />
            </Link>
            <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
              <Link href="/compare" className="text-slate-800 border-b-2 border-red-500 pb-0.5">
                对比
              </Link>
              <Link href="/players" className="text-slate-400 hover:text-slate-600 transition-colors">
                球员
              </Link>
              <Link href="/about" className="text-slate-400 hover:text-slate-600 transition-colors">
                关于
              </Link>
            </nav>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Player selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-3">
            <PlayerSelect
              players={players}
              selected={playerA}
              onSelect={handleSelectA}
              label="球员 A"
              accentClass="text-red-600"
            />
            {mode === "season" && (
              <SeasonSelect
                seasons={seasonsA}
                selected={seasonA}
                onSelect={setSeasonA}
                label="赛季"
                accentClass="text-red-600"
                disabled={!playerA}
              />
            )}
          </div>
          <div className="space-y-3">
            <PlayerSelect
              players={players}
              selected={playerB}
              onSelect={handleSelectB}
              label="球员 B"
              accentClass="text-blue-700"
            />
            {mode === "season" && (
              <SeasonSelect
                seasons={seasonsB}
                selected={seasonB}
                onSelect={setSeasonB}
                label="赛季"
                accentClass="text-blue-700"
                disabled={!playerB}
              />
            )}
          </div>
        </div>

        {/* Player cards */}
        {(playerA || playerB) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {playerA ? (
              <PlayerCard
                player={playerA}
                side="left"
                mode={mode}
                seasonData={seasonDataA}
                seasonLabel={seasonA}
              />
            ) : (
              <div className="flex items-center justify-center p-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 bg-white/60">
                请选择球员 A
              </div>
            )}
            {playerB ? (
              <PlayerCard
                player={playerB}
                side="right"
                mode={mode}
                seasonData={seasonDataB}
                seasonLabel={seasonB}
              />
            ) : (
              <div className="flex items-center justify-center p-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 bg-white/60">
                请选择球员 B
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!playerA && !playerB && (
          <div className="text-center py-16 sm:py-24 text-slate-300">
            <div className="text-6xl mb-5 opacity-50">🏀</div>
            <p className="text-lg font-medium text-slate-400">
              选择两名球员开始对比
            </p>
            <p className="text-sm mt-1.5 text-slate-350">
              支持中文名 / 英文名搜索
            </p>
            
            {/* 预设对比入口 */}
            <div className="mt-8 max-w-md mx-auto">
              <p className="text-xs text-slate-400 mb-3">快速开始：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: "乔丹 vs 詹姆斯", player1: "Michael Jordan", player2: "LeBron James" },
                  { name: "科比 vs 邓肯", player1: "Kobe Bryant", player2: "Tim Duncan" },
                  { name: "库里 vs 杜兰特", player1: "Stephen Curry", player2: "Kevin Durant" },
                  { name: "奥尼尔 vs 奥拉朱旺", player1: "Shaquille O'Neal", player2: "Hakeem Olajuwon" },
                  { name: "伯德 vs 魔术师", player1: "Larry Bird", player2: "Magic Johnson" }
                ].map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setPlayerA(getPlayerById(preset.player1) ?? null);
                      setPlayerB(getPlayerById(preset.player2) ?? null);
                      analytics.presetComparisonClick(preset.name);
                    }}
                    className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all text-slate-500 hover:text-slate-700"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VS indicator */}
        {playerA && playerB && (
          <div className="flex items-center justify-center my-6 sm:my-10">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-right">
                <Link href={`/player/${playerA.id}`} className="text-red-600 font-bold text-base sm:text-lg hover:underline">
                  {playerA.nameZh}
                </Link>
                {mode === "season" && seasonA && (
                  <span className="text-red-400 text-xs sm:text-sm ml-1.5 sm:ml-2">
                    {seasonA}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="text-2xl sm:text-3xl font-black text-slate-200">VS</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 blur-xl" />
              </div>
              <div className="text-left">
                <Link href={`/player/${playerB.id}`} className="text-blue-700 font-bold text-base sm:text-lg hover:underline">
                  {playerB.nameZh}
                </Link>
                {mode === "season" && seasonB && (
                  <span className="text-blue-400 text-xs sm:text-sm ml-1.5 sm:ml-2">
                    {seasonB}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compare table + Summary */}
        {playerA && playerB && (
          <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-8 animate-fade-in-up">
            <CompareTable
              playerA={playerA}
              playerB={playerB}
              mode={mode}
              seasonDataA={seasonDataA}
              seasonDataB={seasonDataB}
            />
            <CompareSummary
              playerA={playerA}
              playerB={playerB}
              mode={mode}
              seasonDataA={seasonDataA}
              seasonDataB={seasonDataB}
            />

              {/* Generate card button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setShowCard(true);
                    if (playerA && playerB) {
                      analytics.cardGenerate(playerA.nameZh, playerB.nameZh, mode);
                    }
                  }}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-sm sm:text-base"
                  style={{
                    background: "linear-gradient(135deg, #C8102E, #1D428A)",
                  }}
                >
                  生成分享卡片
                </button>
              </div>
          </div>
        )}
      </main>

      {/* Share card overlay */}
      {showCard && playerA && playerB && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm overflow-auto">
          <div className="relative flex flex-col items-center max-h-[95vh] overflow-auto py-4 sm:py-6">
            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap justify-center px-4">
              {/* Language toggle */}
              <div className="flex rounded-lg overflow-hidden border border-white/20">
                <button
                  onClick={() => setCardLang("zh")}
                  className="px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: cardLang === "zh" ? "rgba(255,255,255,0.2)" : "transparent",
                    color: cardLang === "zh" ? "white" : "rgba(255,255,255,0.5)",
                  }}
                >
                  中文
                </button>
                <button
                  onClick={() => setCardLang("en")}
                  className="px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: cardLang === "en" ? "rgba(255,255,255,0.2)" : "transparent",
                    color: cardLang === "en" ? "white" : "rgba(255,255,255,0.5)",
                  }}
                >
                  EN
                </button>
              </div>

              <button
                onClick={async () => {
                  await handleDownloadPng();
                  if (playerA && playerB) {
                    analytics.cardDownload(playerA.nameZh, playerB.nameZh, mode, cardLang);
                  }
                }}
                disabled={downloading}
                className="px-6 py-2.5 rounded-lg font-bold text-white text-sm shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #C8102E, #1D428A)",
                }}
              >
                {downloading ? "生成中..." : "下载 PNG"}
              </button>

              {/* Copy share link */}
              <button
                onClick={async () => {
                  await handleCopyCardLink();
                  if (playerA && playerB) {
                    analytics.shareLinkCopy(playerA.nameZh, playerB.nameZh, mode);
                  }
                }}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border"
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : "transparent",
                  borderColor: copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)",
                  color: copied ? "#4ade80" : "rgba(255,255,255,0.7)",
                }}
              >
                {copied ? "已复制" : "复制分享链接"}
              </button>

              {/* Open card page */}
              <a
                href={cardShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg font-semibold text-white/70 text-sm bg-white/10 hover:bg-white/20 transition-all"
              >
                打开卡片页
              </a>

              <button
                onClick={() => setShowCard(false)}
                className="px-5 py-2.5 rounded-lg font-semibold text-white/50 text-sm bg-white/5 hover:bg-white/10 transition-all"
              >
                关闭
              </button>
            </div>

            {/* Card preview (scaled down for display) */}
            <div
              style={{
                transform: "scale(0.45)",
                transformOrigin: "top center",
                marginBottom: -1350 * 0.55,
              }}
            >
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
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-4 bg-white/40">
        <p className="text-center text-[11px] text-slate-400">
          GOAT — Greatest Of All Time Comparator
        </p>
      </footer>
    </div>
  );
}
