import type { RankedPlayer } from "../api";

interface PlayerCompareProps {
  player1: RankedPlayer;
  player2: RankedPlayer;
  rank1: number;
  rank2: number;
}

interface CompareItem {
  label: string;
  value1: number | string;
  value2: number | string;
  numValue1: number;
  numValue2: number;
}

export default function PlayerCompare({
  player1,
  player2,
  rank1,
  rank2,
}: PlayerCompareProps) {
  const p1 = player1.player;
  const p2 = player2.player;

  const compareItems: CompareItem[] = [
    { label: "综合评分", value1: player1.score.toFixed(1), value2: player2.score.toFixed(1), numValue1: player1.score, numValue2: player2.score },
    { label: "🏆 总冠军", value1: p1.championships, value2: p2.championships, numValue1: p1.championships, numValue2: p2.championships },
    { label: "🏅 MVP", value1: p1.mvp, value2: p2.mvp, numValue1: p1.mvp, numValue2: p2.mvp },
    { label: "🏅 FMVP", value1: p1.fmvp, value2: p2.fmvp, numValue1: p1.fmvp, numValue2: p2.fmvp },
    { label: "⭐ 全明星", value1: p1.allStar, value2: p2.allStar, numValue1: p1.allStar, numValue2: p2.allStar },
    { label: "📋 最佳阵容", value1: p1.allNBA1st + p1.allNBA2nd + p1.allNBA3rd, value2: p2.allNBA1st + p2.allNBA2nd + p2.allNBA3rd, numValue1: p1.allNBA1st + p1.allNBA2nd + p1.allNBA3rd, numValue2: p2.allNBA1st + p2.allNBA2nd + p2.allNBA3rd },
    { label: "📊 场均得分", value1: p1.ppg, value2: p2.ppg, numValue1: p1.ppg, numValue2: p2.ppg },
    { label: "📊 场均篮板", value1: p1.rpg, value2: p2.rpg, numValue1: p1.rpg, numValue2: p2.rpg },
    { label: "📊 场均助攻", value1: p1.apg, value2: p2.apg, numValue1: p1.apg, numValue2: p2.apg },
    { label: "📈 生涯总分", value1: p1.totalPoints.toLocaleString(), value2: p2.totalPoints.toLocaleString(), numValue1: p1.totalPoints, numValue2: p2.totalPoints },
    { label: "⚔️ 季后赛得分", value1: p1.playoffPPG, value2: p2.playoffPPG, numValue1: p1.playoffPPG, numValue2: p2.playoffPPG },
    { label: "⚔️ 季后赛胜场", value1: p1.playoffWins, value2: p2.playoffWins, numValue1: p1.playoffWins, numValue2: p2.playoffWins },
    { label: "🔥 巅峰得分", value1: p1.peakPPG, value2: p2.peakPPG, numValue1: p1.peakPPG, numValue2: p2.peakPPG },
  ];

  const p1Wins = compareItems.filter((item) => item.numValue1 > item.numValue2).length;
  const p2Wins = compareItems.filter((item) => item.numValue2 > item.numValue1).length;

  return (
    <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700">
      {/* 头部 VS */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <div className="text-4xl mb-2">{p1.avatar}</div>
          <div className="text-lg font-bold text-white">{p1.name}</div>
          <div className="text-xs text-gray-400">#{rank1} | {p1.position}</div>
          <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
            {player1.score.toFixed(1)}
          </div>
        </div>

        <div className="text-center px-4">
          <div className="text-3xl font-black text-gray-500">VS</div>
          <div className="text-sm text-gray-500 mt-2">
            <span className="text-green-400">{p1Wins}</span>
            {" - "}
            <span className="text-blue-400">{p2Wins}</span>
          </div>
        </div>

        <div className="text-center flex-1">
          <div className="text-4xl mb-2">{p2.avatar}</div>
          <div className="text-lg font-bold text-white">{p2.name}</div>
          <div className="text-xs text-gray-400">#{rank2} | {p2.position}</div>
          <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
            {player2.score.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 对比条目 */}
      <div className="space-y-2">
        {compareItems.map((item) => {
          const isP1Better = item.numValue1 > item.numValue2;
          const isP2Better = item.numValue2 > item.numValue1;
          const isTie = item.numValue1 === item.numValue2;

          return (
            <div key={item.label} className="flex items-center gap-2 py-1">
              {/* 左侧数值 */}
              <span
                className={`flex-1 text-right text-sm font-mono font-bold
                  ${isP1Better ? "text-green-400" : isTie ? "text-gray-400" : "text-gray-500"}`}
              >
                {isP1Better && "✓ "}{item.value1}
              </span>

              {/* 中间标签 */}
              <span className="w-28 text-center text-xs text-gray-400 shrink-0">
                {item.label}
              </span>

              {/* 右侧数值 */}
              <span
                className={`flex-1 text-left text-sm font-mono font-bold
                  ${isP2Better ? "text-blue-400" : isTie ? "text-gray-400" : "text-gray-500"}`}
              >
                {item.value2}{isP2Better && " ✓"}
              </span>
            </div>
          );
        })}
      </div>

      {/* 底部总结 */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-center">
        {player1.score > player2.score ? (
          <p className="text-green-400 font-bold">
            {p1.avatar} {p1.name} 在当前权重下排名更高
            <span className="text-gray-400 font-normal">
              （领先 {(player1.score - player2.score).toFixed(1)} 分）
            </span>
          </p>
        ) : player2.score > player1.score ? (
          <p className="text-blue-400 font-bold">
            {p2.avatar} {p2.name} 在当前权重下排名更高
            <span className="text-gray-400 font-normal">
              （领先 {(player2.score - player1.score).toFixed(1)} 分）
            </span>
          </p>
        ) : (
          <p className="text-yellow-400 font-bold">两位球员在当前权重下评分相同！</p>
        )}
      </div>
    </div>
  );
}