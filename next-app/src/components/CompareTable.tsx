"use client";

import type { Player, PlayerSeason, CompareMode } from "@/lib/types";

interface CompareTableProps {
  playerA: Player;
  playerB: Player;
  mode: CompareMode;
  seasonDataA?: PlayerSeason;
  seasonDataB?: PlayerSeason;
}

type StatKey = "pts" | "reb" | "ast" | "tsPct" | "fgPct" | "tpPct" | "gp" | "mp";
type HonorKey = "mvp" | "fmvp";

interface StatRow {
  key: StatKey;
  label: string;
  unit?: string;
  higherIsBetter: boolean;
}

interface HonorRow {
  key: HonorKey;
  label: string;
}

const STAT_ROWS: StatRow[] = [
  { key: "pts", label: "得分", higherIsBetter: true },
  { key: "reb", label: "篮板", higherIsBetter: true },
  { key: "ast", label: "助攻", higherIsBetter: true },
  { key: "tsPct", label: "TS%", unit: "%", higherIsBetter: true },
  { key: "fgPct", label: "FG%", unit: "%", higherIsBetter: true },
  { key: "tpPct", label: "3P%", unit: "%", higherIsBetter: true },
  { key: "gp", label: "出场", higherIsBetter: true },
  { key: "mp", label: "分钟", higherIsBetter: true },
];

const HONOR_ROWS: HonorRow[] = [
  { key: "mvp", label: "MVP" },
  { key: "fmvp", label: "FMVP" },
];

function getStatValue(
  player: Player,
  key: StatKey,
  mode: CompareMode,
  seasonData?: PlayerSeason
): number | null {
  if (mode === "season" && seasonData) {
    return seasonData[key] ?? null;
  }
  const val = player.career[key];
  return val ?? null;
}

function getHonorValue(
  player: Player,
  key: HonorKey,
  mode: CompareMode,
  seasonData?: PlayerSeason
): number {
  if (mode === "season" && seasonData) {
    return seasonData[key] ?? 0;
  }
  return player.career[key] ?? 0;
}

function formatValue(val: number | null, unit?: string): string {
  if (val === null || val === undefined) return "—";
  if (unit === "%") return val.toFixed(1);
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1);
}

function formatDiff(diff: number, unit?: string): string {
  const sign = diff > 0 ? "+" : "";
  if (unit === "%") return `${sign}${diff.toFixed(1)}`;
  if (Number.isInteger(diff)) return `${sign}${diff}`;
  return `${sign}${diff.toFixed(1)}`;
}

export default function CompareTable({
  playerA,
  playerB,
  mode,
  seasonDataA,
  seasonDataB,
}: CompareTableProps) {
  // 赛季模式下，如果某球员无赛季数据，显示提示
  const missingA = mode === "season" && !seasonDataA;
  const missingB = mode === "season" && !seasonDataB;

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden">
      {(missingA || missingB) && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-center text-xs text-amber-600">
          {missingA && missingB
            ? `${playerA.nameZh} 和 ${playerB.nameZh} 暂无该赛季数据，显示生涯数据`
            : missingA
            ? `${playerA.nameZh} 暂无该赛季数据，显示生涯数据`
            : `${playerB.nameZh} 暂无该赛季数据，显示生涯数据`}
        </div>
      )}
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_60px_auto_1fr] sm:grid-cols-[1fr_auto_80px_auto_1fr] items-center px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-right font-bold text-red-600 text-xs sm:text-sm truncate pr-1.5 sm:pr-2">
          {playerA.nameZh}
        </div>
        <div className="w-5 sm:w-8" />
        <div className="text-center text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          指标
        </div>
        <div className="w-5 sm:w-8" />
        <div className="text-left font-bold text-blue-700 text-xs sm:text-sm truncate pl-1.5 sm:pl-2">
          {playerB.nameZh}
        </div>
      </div>

      {/* Stat rows */}
      {STAT_ROWS.map((row, i) => {
        const valA = getStatValue(playerA, row.key, mode, seasonDataA);
        const valB = getStatValue(playerB, row.key, mode, seasonDataB);

        const bothValid = valA !== null && valB !== null;
        const diff = bothValid ? valA! - valB! : null;
        const aWins = bothValid && row.higherIsBetter ? valA! > valB! : false;
        const bWins = bothValid && row.higherIsBetter ? valB! > valA! : false;
        const tie = bothValid && valA === valB;

        return (
          <div
            key={row.key}
            className={`grid grid-cols-[1fr_auto_60px_auto_1fr] sm:grid-cols-[1fr_auto_80px_auto_1fr] items-center px-3 sm:px-4 py-2 sm:py-2.5 ${
              i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            } border-b border-slate-50 last:border-b-0`}
          >
            {/* Value A */}
            <div className="text-right pr-1.5 sm:pr-2">
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  aWins
                    ? "text-red-600"
                    : tie
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {formatValue(valA, row.unit)}
              </span>
              {aWins && diff !== null && (
                <span className="text-[9px] sm:text-[10px] text-red-400 ml-1 sm:ml-1.5">
                  {formatDiff(diff, row.unit)}
                </span>
              )}
            </div>

            {/* Indicator A */}
            <div className="w-5 sm:w-8 flex justify-center">
              {aWins && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
              )}
            </div>

            {/* Label */}
            <div className="text-center text-[10px] sm:text-xs font-medium text-slate-500">
              {row.label}
            </div>

            {/* Indicator B */}
            <div className="w-5 sm:w-8 flex justify-center">
              {bWins && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600" />
              )}
            </div>

            {/* Value B */}
            <div className="text-left pl-1.5 sm:pl-2">
              {bWins && diff !== null && (
                <span className="text-[9px] sm:text-[10px] text-blue-400 mr-1 sm:mr-1.5">
                  {formatDiff(-diff, row.unit)}
                </span>
              )}
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  bWins
                    ? "text-blue-700"
                    : tie
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {formatValue(valB, row.unit)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Honor section divider */}
      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 border-y border-amber-100">
        <p className="text-center text-[9px] sm:text-[10px] text-amber-600 uppercase tracking-widest font-semibold">
          荣誉
        </p>
      </div>

      {/* Honor rows */}
      {HONOR_ROWS.map((row, i) => {
        const valA = getHonorValue(playerA, row.key, mode, seasonDataA);
        const valB = getHonorValue(playerB, row.key, mode, seasonDataB);
        const diff = valA - valB;
        const aWins = valA > valB;
        const bWins = valB > valA;
        const tie = valA === valB;

        return (
          <div
            key={row.key}
            className={`grid grid-cols-[1fr_auto_60px_auto_1fr] sm:grid-cols-[1fr_auto_80px_auto_1fr] items-center px-3 sm:px-4 py-2 sm:py-2.5 ${
              i % 2 === 0 ? "bg-amber-50/30" : "bg-white"
            } ${i < HONOR_ROWS.length - 1 ? "border-b border-slate-50" : ""}`}
          >
            {/* Value A */}
            <div className="text-right pr-1.5 sm:pr-2">
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  aWins
                    ? "text-amber-600"
                    : tie
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {valA}
              </span>
              {aWins && (
                <span className="text-[9px] sm:text-[10px] text-amber-400 ml-1 sm:ml-1.5">
                  +{diff}
                </span>
              )}
            </div>

            {/* Indicator A */}
            <div className="w-5 sm:w-8 flex justify-center">
              {aWins && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" />
              )}
            </div>

            {/* Label */}
            <div className="text-center text-[10px] sm:text-xs font-medium text-amber-700">
              {row.label}
            </div>

            {/* Indicator B */}
            <div className="w-5 sm:w-8 flex justify-center">
              {bWins && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" />
              )}
            </div>

            {/* Value B */}
            <div className="text-left pl-1.5 sm:pl-2">
              {bWins && (
                <span className="text-[9px] sm:text-[10px] text-amber-400 mr-1 sm:mr-1.5">
                  +{-diff}
                </span>
              )}
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  bWins
                    ? "text-amber-600"
                    : tie
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {valB}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
