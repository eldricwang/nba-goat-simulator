"use client";

import { forwardRef, useState, useEffect } from "react";
import type { Player, PlayerSeason, CompareMode } from "@/lib/types";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";

export type CardLang = "zh" | "en";

interface ShareCardProps {
  playerA: Player;
  playerB: Player;
  mode: CompareMode;
  lang?: CardLang;
  seasonDataA?: PlayerSeason;
  seasonDataB?: PlayerSeason;
  seasonLabelA?: string | null;
  seasonLabelB?: string | null;
}

type StatKey =
  | "pts"
  | "reb"
  | "ast"
  | "tsPct"
  | "fgPct"
  | "tpPct"
  | "gp"
  | "mp";

interface StatRow {
  key: StatKey;
  label: string;
  labelZh: string;
  unit?: string;
}

const STAT_ROWS: StatRow[] = [
  { key: "pts", label: "PTS", labelZh: "得分" },
  { key: "reb", label: "REB", labelZh: "篮板" },
  { key: "ast", label: "AST", labelZh: "助攻" },
  { key: "tsPct", label: "TS%", labelZh: "真实命中", unit: "%" },
  { key: "fgPct", label: "FG%", labelZh: "投篮命中", unit: "%" },
  { key: "tpPct", label: "3P%", labelZh: "三分命中", unit: "%" },
  { key: "gp", label: "GP", labelZh: "场次" },
  { key: "mp", label: "MIN", labelZh: "分钟" },
];

// i18n text map
const TEXT = {
  zh: {
    career: "生涯数据",
    season: "赛季",
    honors: "荣誉",
    watermark: "GOAT 对比器",
    disclaimer: "数据仅供参考",
    moreScoring: (name: string, d: string) => `${name} 场均多得 ${d} 分`,
    moreAssists: (name: string, d: string) => `${name} 场均多送 ${d} 助攻`,
    moreRebounds: (name: string, d: string) => `${name} 场均多抢 ${d} 篮板`,
    betterTS: (name: string, d: string) => `${name} 真实命中率高 ${d}%`,
    betterHonors: (name: string) => `${name} 荣誉更突出`,
  },
  en: {
    career: "CAREER STATS",
    season: "SEASON",
    honors: "HONORS",
    watermark: "GOAT COMPARATOR",
    disclaimer: "Data for reference only",
    moreScoring: (name: string, d: string) => `${name} averages ${d} more PPG`,
    moreAssists: (name: string, d: string) => `${name} averages ${d} more APG`,
    moreRebounds: (name: string, d: string) => `${name} averages ${d} more RPG`,
    betterTS: (name: string, d: string) => `${name} has ${d}% higher TS%`,
    betterHonors: (name: string) => `${name} has more accolades`,
  },
} as const;

function getVal(
  player: Player,
  key: string,
  mode: CompareMode,
  seasonData?: PlayerSeason
): number | null {
  if (mode === "season" && seasonData) {
    return (seasonData as Record<string, unknown>)[key] as number ?? null;
  }
  return (player.career as Record<string, unknown>)[key] as number ?? null;
}

function fmt(val: number | null, unit?: string): string {
  if (val === null || val === undefined) return "\u2014";
  if (unit === "%") return val.toFixed(1);
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1);
}

function fmtDiff(diff: number, unit?: string): string {
  const sign = diff > 0 ? "+" : "";
  if (unit === "%") return `${sign}${diff.toFixed(1)}`;
  if (Number.isInteger(diff)) return `${sign}${diff}`;
  return `${sign}${diff.toFixed(1)}`;
}

function getName(player: Player, lang: CardLang) {
  return lang === "zh" ? player.nameZh : player.nameEn;
}

function getInsights(
  pA: Player,
  pB: Player,
  mode: CompareMode,
  lang: CardLang,
  sdA?: PlayerSeason,
  sdB?: PlayerSeason
): { winner: "A" | "B"; text: string; magnitude: number }[] {
  const t = TEXT[lang];
  const nA = getName(pA, lang);
  const nB = getName(pB, lang);
  const ins: { winner: "A" | "B"; text: string; magnitude: number }[] = [];

  const ptsA = getVal(pA, "pts", mode, sdA);
  const ptsB = getVal(pB, "pts", mode, sdB);
  if (ptsA !== null && ptsB !== null && ptsA !== ptsB) {
    const d = Math.abs(ptsA - ptsB);
    const w = ptsA > ptsB ? "A" as const : "B" as const;
    ins.push({ winner: w, text: t.moreScoring(w === "A" ? nA : nB, d.toFixed(1)), magnitude: d / Math.max(ptsA, ptsB) });
  }

  const astA = getVal(pA, "ast", mode, sdA);
  const astB = getVal(pB, "ast", mode, sdB);
  if (astA !== null && astB !== null && astA !== astB) {
    const d = Math.abs(astA - astB);
    const w = astA > astB ? "A" as const : "B" as const;
    ins.push({ winner: w, text: t.moreAssists(w === "A" ? nA : nB, d.toFixed(1)), magnitude: d / Math.max(astA, astB) });
  }

  const rebA = getVal(pA, "reb", mode, sdA);
  const rebB = getVal(pB, "reb", mode, sdB);
  if (rebA !== null && rebB !== null && rebA !== rebB) {
    const d = Math.abs(rebA - rebB);
    const w = rebA > rebB ? "A" as const : "B" as const;
    ins.push({ winner: w, text: t.moreRebounds(w === "A" ? nA : nB, d.toFixed(1)), magnitude: d / Math.max(rebA, rebB) });
  }

  const tsA = getVal(pA, "tsPct", mode, sdA);
  const tsB = getVal(pB, "tsPct", mode, sdB);
  if (tsA !== null && tsB !== null && tsA !== tsB) {
    const d = Math.abs(tsA - tsB);
    const w = tsA > tsB ? "A" as const : "B" as const;
    ins.push({ winner: w, text: t.betterTS(w === "A" ? nA : nB, d.toFixed(1)), magnitude: d / 100 });
  }

  const mvpA = (getVal(pA, "mvp", mode, sdA) ?? 0) + (getVal(pA, "fmvp", mode, sdA) ?? 0);
  const mvpB = (getVal(pB, "mvp", mode, sdB) ?? 0) + (getVal(pB, "fmvp", mode, sdB) ?? 0);
  if (mvpA !== mvpB && mode === "career") {
    const w = mvpA > mvpB ? "A" as const : "B" as const;
    ins.push({ winner: w, text: t.betterHonors(w === "A" ? nA : nB), magnitude: Math.abs(mvpA - mvpB) / Math.max(mvpA, mvpB, 1) });
  }

  ins.sort((a, b) => b.magnitude - a.magnitude);
  return ins.slice(0, 3);
}

/** Headshot image component with fallback to initials */
function Headshot({
  player,
  size,
  borderColor,
  bgGradient,
}: {
  player: Player;
  size: number;
  borderColor: string;
  bgGradient: string;
}) {
  const url = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);
  const [errored, setErrored] = useState(false);

  // Reset error when player changes
  useEffect(() => {
    setErrored(false);
  }, [player.id]);

  if (!url || errored) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bgGradient,
          border: `3px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.4,
          fontWeight: 900,
          color: "white",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${borderColor}`,
        overflow: "hidden",
        background: "#1a2740",
        position: "relative",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={player.nameEn}
        onError={() => setErrored(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          transform: "scale(1.3)",
          transformOrigin: "top center",
        }}
      />
    </div>
  );
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard(
    { playerA, playerB, mode, lang = "zh", seasonDataA, seasonDataB, seasonLabelA, seasonLabelB },
    ref
  ) {
    const t = TEXT[lang];
    const insights = getInsights(playerA, playerB, mode, lang, seasonDataA, seasonDataB);

    const mvpA = getVal(playerA, "mvp", mode, seasonDataA) ?? 0;
    const fmvpA = getVal(playerA, "fmvp", mode, seasonDataA) ?? 0;
    const mvpB = getVal(playerB, "mvp", mode, seasonDataB) ?? 0;
    const fmvpB = getVal(playerB, "fmvp", mode, seasonDataB) ?? 0;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "linear-gradient(170deg, #0f1923 0%, #1a2740 40%, #0d1b2a 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(200,16,46,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(29,66,138,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* === TOP: Title bar === */}
        <div
          style={{
            padding: "40px 60px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* GOAT branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #C8102E, #1D428A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
                color: "white",
                letterSpacing: 1,
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>GOAT</div>
              <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 2, marginTop: -2 }}>
                GREATEST OF ALL TIME
              </div>
            </div>
          </div>
          {/* Mode badge */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "8px 24px",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {mode === "career"
              ? t.career
              : `${t.season} ${seasonLabelA || ""}`}
          </div>
        </div>

        {/* === PLAYERS: Headshots + Names + VS === */}
        <div
          style={{
            padding: "20px 60px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {/* Player A */}
          <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <Headshot
                player={playerA}
                size={120}
                borderColor="rgba(200,16,46,0.5)"
                bgGradient="linear-gradient(135deg, #C8102E, #8B0000)"
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              {getName(playerA, lang)}
            </div>
            {lang === "zh" && (
              <div style={{ fontSize: 15, opacity: 0.5 }}>
                {playerA.nameEn}
              </div>
            )}
            {lang === "en" && (
              <div style={{ fontSize: 15, opacity: 0.5 }}>
                {playerA.nameZh}
              </div>
            )}
            {playerA.position && (
              <div
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  background: "rgba(200,16,46,0.2)",
                  borderRadius: 12,
                  padding: "3px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ff6b7a",
                }}
              >
                {playerA.position}
              </div>
            )}
          </div>

          {/* VS */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 4,
              }}
            >
              VS
            </div>
          </div>

          {/* Player B */}
          <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <Headshot
                player={playerB}
                size={120}
                borderColor="rgba(29,66,138,0.5)"
                bgGradient="linear-gradient(135deg, #1D428A, #0a1e4a)"
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              {getName(playerB, lang)}
            </div>
            {lang === "zh" && (
              <div style={{ fontSize: 15, opacity: 0.5 }}>
                {playerB.nameEn}
              </div>
            )}
            {lang === "en" && (
              <div style={{ fontSize: 15, opacity: 0.5 }}>
                {playerB.nameZh}
              </div>
            )}
            {playerB.position && (
              <div
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  background: "rgba(29,66,138,0.2)",
                  borderRadius: 12,
                  padding: "3px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6b9bff",
                }}
              >
                {playerB.position}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            margin: "0 60px",
            height: 1,
            background: "linear-gradient(90deg, rgba(200,16,46,0.3), rgba(255,255,255,0.1), rgba(29,66,138,0.3))",
          }}
        />

        {/* === STATS TABLE === */}
        <div style={{ padding: "24px 60px 16px", flex: 1 }}>
          {/* Table header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 0 12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ flex: 1, textAlign: "right", fontSize: 14, fontWeight: 700, color: "#ff6b7a", paddingRight: 20 }}>
              {getName(playerA, lang)}
            </div>
            <div style={{ width: 100, textAlign: "center", fontSize: 11, fontWeight: 600, opacity: 0.3, letterSpacing: 3, textTransform: "uppercase" as const }}>
              STAT
            </div>
            <div style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 700, color: "#6b9bff", paddingLeft: 20 }}>
              {getName(playerB, lang)}
            </div>
          </div>

          {/* Stat rows */}
          {STAT_ROWS.map((row, i) => {
            const vA = getVal(playerA, row.key, mode, seasonDataA);
            const vB = getVal(playerB, row.key, mode, seasonDataB);
            const both = vA !== null && vB !== null;
            const diff = both ? vA! - vB! : null;
            const aWins = both && vA! > vB!;
            const bWins = both && vB! > vA!;

            return (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: i < STAT_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                }}
              >
                {/* Value A + diff */}
                <div style={{ flex: 1, textAlign: "right", paddingRight: 20, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                  {aWins && diff !== null && (
                    <span style={{ fontSize: 13, color: "rgba(255,107,122,0.6)", fontWeight: 500 }}>
                      {fmtDiff(diff, row.unit)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: aWins ? 800 : 500,
                      color: aWins ? "#ff6b7a" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {fmt(vA, row.unit)}
                  </span>
                  {aWins && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C8102E" }} />
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    width: 100,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: 1,
                  }}
                >
                  {lang === "zh" ? row.labelZh : row.label}
                </div>

                {/* Value B + diff */}
                <div style={{ flex: 1, textAlign: "left", paddingLeft: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  {bWins && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D428A" }} />
                  )}
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: bWins ? 800 : 500,
                      color: bWins ? "#6b9bff" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {fmt(vB, row.unit)}
                  </span>
                  {bWins && diff !== null && (
                    <span style={{ fontSize: 13, color: "rgba(107,155,255,0.6)", fontWeight: 500 }}>
                      {fmtDiff(-diff, row.unit)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* === HONORS BAR === */}
          <div
            style={{
              marginTop: 16,
              padding: "14px 0 8px",
              borderTop: "1px solid rgba(255,215,0,0.15)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,215,0,0.5)",
                letterSpacing: 4,
                marginBottom: 12,
                textTransform: "uppercase" as const,
              }}
            >
              {t.honors}
            </div>
            <div style={{ display: "flex", gap: 0 }}>
              {/* MVP row */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <span style={{ fontSize: 20, fontWeight: mvpA > mvpB ? 800 : 500, color: mvpA > mvpB ? "#ffd700" : "rgba(255,255,255,0.3)" }}>
                  {mvpA}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,215,0,0.5)", letterSpacing: 1 }}>MVP</span>
                <span style={{ fontSize: 20, fontWeight: mvpB > mvpA ? 800 : 500, color: mvpB > mvpA ? "#ffd700" : "rgba(255,255,255,0.3)" }}>
                  {mvpB}
                </span>
              </div>
              {/* Separator */}
              <div style={{ width: 1, height: 28, background: "rgba(255,215,0,0.15)" }} />
              {/* FMVP row */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <span style={{ fontSize: 20, fontWeight: fmvpA > fmvpB ? 800 : 500, color: fmvpA > fmvpB ? "#ffd700" : "rgba(255,255,255,0.3)" }}>
                  {fmvpA}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,215,0,0.5)", letterSpacing: 1 }}>FMVP</span>
                <span style={{ fontSize: 20, fontWeight: fmvpB > fmvpA ? 800 : 500, color: fmvpB > fmvpA ? "#ffd700" : "rgba(255,255,255,0.3)" }}>
                  {fmvpB}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === BOTTOM: Insights + Watermark === */}
        <div style={{ padding: "0 60px 40px" }}>
          {/* Insights */}
          {insights.length > 0 && (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: "20px 28px",
                marginBottom: 24,
              }}
            >
              {insights.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: i < insights.length - 1 ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: ins.winner === "A" ? "#C8102E" : "#1D428A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {ins.winner === "A"
                      ? getPlayerInitials(playerA.nameEn)
                      : getPlayerInitials(playerB.nameEn)}
                  </div>
                  <span style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.5 }}>
                    {ins.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Watermark */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: 0.25,
            }}
          >
            <span style={{ fontSize: 12, letterSpacing: 2 }}>
              {t.watermark}
            </span>
            <span style={{ fontSize: 12 }}>
              {t.disclaimer}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default ShareCard;
