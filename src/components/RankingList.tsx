import type { RankedPlayer } from "../utils/calculator";

interface RankingListProps {
  rankings: RankedPlayer[];
  onSelectPlayer: (player: RankedPlayer) => void;
  selectedPlayerId: number | null;
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-yellow-400";
  return "text-gray-400";
}

export default function RankingList({
  rankings,
  onSelectPlayer,
  selectedPlayerId,
}: RankingListProps) {
  return (
    <div className="space-y-2">
      {rankings.map((ranked, index) => {
        const rank = index + 1;
        const isSelected = ranked.player.id === selectedPlayerId;

        return (
          <div
            key={ranked.player.id}
            onClick={() => onSelectPlayer(ranked)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
              transition-all duration-200
              ${
                isSelected
                  ? "bg-orange-500/20 border border-orange-500"
                  : "bg-gray-800/50 border border-transparent hover:bg-gray-800 hover:border-gray-600"
              }
              ${rank <= 3 ? "py-4" : ""}`}
          >
            {/* 排名 */}
            <div
              className={`w-10 text-center font-bold shrink-0
              ${rank <= 3 ? "text-2xl" : "text-lg text-gray-500"}`}
            >
              {getMedalEmoji(rank)}
            </div>

            {/* 球员头像emoji */}
            <div className="text-2xl shrink-0">{ranked.player.avatar}</div>

            {/* 球员信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold truncate ${
                    rank <= 3 ? "text-lg text-white" : "text-base text-gray-200"
                  }`}
                >
                  {ranked.player.name}
                </span>
                <span className="text-xs text-gray-500 shrink-0">
                  {ranked.player.position}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {ranked.player.era} | {ranked.player.teams[0]}
                {ranked.player.championships > 0 &&
                  ` | ${ranked.player.championships}冠`}
              </div>
            </div>

            {/* 分数 */}
            <div className="text-right shrink-0">
              <div className={`text-xl font-bold font-mono ${getScoreColor(ranked.score)}`}>
                {ranked.score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">综合分</div>
            </div>

            {/* 分数条 */}
            <div className="w-24 shrink-0 hidden sm:block">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-red-500"
                  style={{ width: `${ranked.score}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}