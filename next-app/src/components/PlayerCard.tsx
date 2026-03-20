"use client";

import { useState } from "react";
import Image from "next/image";
import type { Player, PlayerSeason, CompareMode } from "@/lib/types";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";

interface PlayerCardProps {
  player: Player;
  side: "left" | "right";
  mode?: CompareMode;
  seasonData?: PlayerSeason;
  seasonLabel?: string | null;
}

export default function PlayerCard({
  player,
  side,
  mode = "career",
  seasonData,
  seasonLabel,
}: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);
  const headshotUrl = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);

  const isLeft = side === "left";
  const accent = isLeft ? "#C8102E" : "#1D428A";
  const accentText = isLeft ? "text-red-600" : "text-blue-700";
  const accentBorder = isLeft ? "border-red-200" : "border-blue-200";
  const accentBg = isLeft
    ? "from-red-50 via-white to-white"
    : "from-blue-50 via-white to-white";
  const accentRing = isLeft ? "ring-red-300" : "ring-blue-300";

  const isSeason = mode === "season";
  const pts = isSeason && seasonData ? seasonData.pts : player.career.pts;
  const reb = isSeason && seasonData ? seasonData.reb : player.career.reb;
  const ast = isSeason && seasonData ? seasonData.ast : player.career.ast;

  return (
    <div
      className={`relative flex flex-col items-center p-6 rounded-2xl border ${accentBorder} bg-gradient-to-br ${accentBg} shadow-lg shadow-slate-200/60 overflow-hidden`}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }}
      />

      {/* Avatar */}
      <div
        className={`relative w-24 h-24 rounded-full ring-2 ${accentRing} overflow-hidden bg-slate-100 mb-4`}
      >
        {headshotUrl && !imgError ? (
          <Image
            src={headshotUrl}
            alt={player.nameEn}
            fill
            className="object-cover object-top scale-125"
            sizes="96px"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-2xl font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className={`text-lg font-bold ${accentText}`}>{player.nameZh}</h3>
      <p className="text-slate-400 text-sm">{player.nameEn}</p>

      {/* Tags */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
        {player.position && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {player.position}
          </span>
        )}
        {player.active && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
            现役
          </span>
        )}
        {player.active === false && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
            退役
          </span>
        )}
        {isSeason && (
          seasonData ? (
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-medium border"
              style={{
                background: `${accent}10`,
                color: accent,
                borderColor: `${accent}30`,
              }}
            >
              {seasonLabel}
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-300 border border-slate-200">
              暂无赛季数据
            </span>
          )
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-5 w-full">
        <StatCell label="得分" value={pts} />
        <StatCell label="篮板" value={reb} />
        <StatCell label="助攻" value={ast} />
      </div>

      {isSeason && seasonData && (
        <div className="grid grid-cols-3 gap-2 mt-2 w-full pt-2 border-t border-slate-100">
          <StatCell label="投篮%" value={seasonData.fgPct != null ? seasonData.fgPct.toFixed(1) : "—"} />
          <StatCell label="三分%" value={seasonData.tpPct != null ? seasonData.tpPct.toFixed(1) : "—"} />
          <StatCell label="场次" value={seasonData.gp} />
        </div>
      )}
      {isSeason && !seasonData && (
        <div className="mt-5 text-center text-sm text-slate-300">
          暂无该赛季数据
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center py-2 rounded-lg bg-slate-50/80">
      <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-slate-800 font-bold text-base">{value}</p>
    </div>
  );
}
