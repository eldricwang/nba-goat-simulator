import type { RankedPlayer, WeightConfig } from "../api";
import { WEIGHT_LABELS } from "../types/weights";

interface PlayerCardProps {
  ranked: RankedPlayer;
  rank: number;
}

export default function PlayerCard({ ranked, rank }: PlayerCardProps) {
  const { player, score, breakdown } = ranked;

  // 按分数排序的维度
  const sortedBreakdown = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // 只显示前8个

  return (
    <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl">{player.avatar}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              #{rank}
            </span>
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {player.nameEn} | {player.position} | {player.era}
          </p>
          <p className="text-xs text-gray-500">{player.teams.join(" → ")}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-orange-400">
            {score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">综合评分</div>
        </div>
      </div>

      {/* 核心荣誉 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "总冠军", value: player.championships, emoji: "🏆" },
          { label: "MVP", value: player.mvp, emoji: "🏅" },
          { label: "FMVP", value: player.fmvp, emoji: "🏅" },
          { label: "全明星", value: player.allStar, emoji: "⭐" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-gray-900/50 rounded-lg p-2 text-center"
          >
            <div className="text-lg">{item.emoji}</div>
            <div className="text-xl font-bold text-white">{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 核心数据 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "场均得分", value: player.ppg },
          { label: "场均篮板", value: player.rpg },
          { label: "场均助攻", value: player.apg },
          { label: "季后赛得分", value: player.playoffPPG },
          { label: "生涯总分", value: player.totalPoints.toLocaleString() },
          { label: "巅峰得分", value: player.peakPPG },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-gray-900/50 rounded-lg p-2 text-center"
          >
            <div className="text-lg font-bold text-white">{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 各维度得分条 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400">各维度得分</h3>
        {sortedBreakdown.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-36 shrink-0">
              {WEIGHT_LABELS[key as keyof WeightConfig] || key}
            </span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400 w-10 text-right">
              {value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}