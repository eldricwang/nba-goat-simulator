"use client";

import type { Player, PlayerSeason, CompareMode } from "@/lib/types";

interface CompareSummaryProps {
  playerA: Player;
  playerB: Player;
  mode: CompareMode;
  seasonDataA?: PlayerSeason;
  seasonDataB?: PlayerSeason;
}

interface Insight {
  winner: "A" | "B";
  text: string;
  magnitude: number; // for sorting by significance
}

function val(
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

function generateInsights(
  playerA: Player,
  playerB: Player,
  mode: CompareMode,
  seasonDataA?: PlayerSeason,
  seasonDataB?: PlayerSeason
): Insight[] {
  const nameA = playerA.nameZh;
  const nameB = playerB.nameZh;
  const insights: Insight[] = [];

  // Scoring
  const ptsA = val(playerA, "pts", mode, seasonDataA);
  const ptsB = val(playerB, "pts", mode, seasonDataB);
  if (ptsA !== null && ptsB !== null && ptsA !== ptsB) {
    const diff = Math.abs(ptsA - ptsB);
    const winner = ptsA > ptsB ? "A" : "B";
    const name = winner === "A" ? nameA : nameB;
    insights.push({
      winner,
      text: `${name} 场均多得 ${diff.toFixed(1)} 分，得分能力更强`,
      magnitude: diff / Math.max(ptsA, ptsB),
    });
  }

  // Assists (playmaking)
  const astA = val(playerA, "ast", mode, seasonDataA);
  const astB = val(playerB, "ast", mode, seasonDataB);
  if (astA !== null && astB !== null && astA !== astB) {
    const diff = Math.abs(astA - astB);
    const winner = astA > astB ? "A" : "B";
    const name = winner === "A" ? nameA : nameB;
    insights.push({
      winner,
      text: `${name} 场均多送 ${diff.toFixed(1)} 次助攻，组织能力更出色`,
      magnitude: diff / Math.max(astA, astB),
    });
  }

  // Rebounds
  const rebA = val(playerA, "reb", mode, seasonDataA);
  const rebB = val(playerB, "reb", mode, seasonDataB);
  if (rebA !== null && rebB !== null && rebA !== rebB) {
    const diff = Math.abs(rebA - rebB);
    const winner = rebA > rebB ? "A" : "B";
    const name = winner === "A" ? nameA : nameB;
    insights.push({
      winner,
      text: `${name} 场均多抢 ${diff.toFixed(1)} 个篮板，护筐更强`,
      magnitude: diff / Math.max(rebA, rebB),
    });
  }

  // True shooting efficiency
  const tsA = val(playerA, "tsPct", mode, seasonDataA);
  const tsB = val(playerB, "tsPct", mode, seasonDataB);
  if (tsA !== null && tsB !== null && tsA !== tsB) {
    const diff = Math.abs(tsA - tsB);
    const winner = tsA > tsB ? "A" : "B";
    const name = winner === "A" ? nameA : nameB;
    insights.push({
      winner,
      text: `${name} 的真实命中率高出 ${diff.toFixed(1)}%，投篮效率更高`,
      magnitude: diff / 100,
    });
  }

  // MVP + FMVP combined honors
  const mvpA = val(playerA, "mvp", mode, seasonDataA) ?? 0;
  const fmvpA = val(playerA, "fmvp", mode, seasonDataA) ?? 0;
  const mvpB = val(playerB, "mvp", mode, seasonDataB) ?? 0;
  const fmvpB = val(playerB, "fmvp", mode, seasonDataB) ?? 0;
  const honorsA = mvpA + fmvpA;
  const honorsB = mvpB + fmvpB;
  if (honorsA !== honorsB && mode === "career") {
    const winner = honorsA > honorsB ? "A" : "B";
    const name = winner === "A" ? nameA : nameB;
    const mvpVal = winner === "A" ? mvpA : mvpB;
    const fmvpVal = winner === "A" ? fmvpA : fmvpB;
    insights.push({
      winner,
      text: `${name} 荣誉更突出（${mvpVal} MVP + ${fmvpVal} FMVP）`,
      magnitude: Math.abs(honorsA - honorsB) / Math.max(honorsA, honorsB, 1),
    });
  }

  // Games played (longevity, career only)
  const gpA = val(playerA, "gp", mode, seasonDataA);
  const gpB = val(playerB, "gp", mode, seasonDataB);
  if (gpA !== null && gpB !== null && gpA !== gpB && mode === "career") {
    const diff = Math.abs(gpA - gpB);
    if (diff >= 100) {
      const winner = gpA > gpB ? "A" : "B";
      const name = winner === "A" ? nameA : nameB;
      insights.push({
        winner,
        text: `${name} 多打了 ${Math.round(diff)} 场比赛，生涯更持久`,
        magnitude: diff / Math.max(gpA, gpB) * 0.5, // lower weight
      });
    }
  }

  // Sort by magnitude (most significant difference first) and take top 3
  insights.sort((a, b) => b.magnitude - a.magnitude);
  return insights.slice(0, 3);
}

export default function CompareSummary({
  playerA,
  playerB,
  mode,
  seasonDataA,
  seasonDataB,
}: CompareSummaryProps) {
  const insights = generateInsights(
    playerA,
    playerB,
    mode,
    seasonDataA,
    seasonDataB
  );

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        对比结论
      </h3>
      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                insight.winner === "A" ? "bg-red-500" : "bg-blue-600"
              }`}
            >
              {insight.winner === "A"
                ? playerA.nameZh.charAt(0)
                : playerB.nameZh.charAt(0)}
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
