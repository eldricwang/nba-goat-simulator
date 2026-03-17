import type { PlayerData } from "../data/players";
import type { WeightConfig } from "../types/weights";

export interface RankedPlayer {
  player: PlayerData;
  score: number;
  breakdown: Record<string, number>;
}

// 各维度的历史最大值（用于归一化）
const MAX_VALUES = {
  championships: 11,    // 拉塞尔
  mvp: 6,              // 贾巴尔
  fmvp: 6,             // 乔丹
  allStar: 20,         // 詹姆斯
  allNBA: 18,          // 詹姆斯 (1st+2nd+3rd)
  allDefense: 15,      // 邓肯
  dpoy: 4,             // 穆托姆博/华莱士
  scoringTitle: 10,    // 乔丹
  ppg: 30.1,           // 乔丹/张伯伦
  rpg: 22.9,           // 张伯伦
  apg: 11.2,           // 魔术师
  totalPoints: 40474,  // 詹姆斯
  playoffPPG: 33.4,    // 乔丹
  playoffWins: 183,    // 詹姆斯
  peakPPG: 50.4,       // 张伯伦
};

/**
 * 归一化：将原始值映射到 0-100
 */
function normalize(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.min((value / maxValue) * 100, 100);
}

/**
 * 获取球员在某个维度的原始值
 */
function getPlayerValue(player: PlayerData, key: keyof WeightConfig): number {
  switch (key) {
    case "championships":
      return player.championships;
    case "mvp":
      return player.mvp;
    case "fmvp":
      return player.fmvp;
    case "allStar":
      return player.allStar;
    case "allNBA":
      return player.allNBA1st + player.allNBA2nd + player.allNBA3rd;
    case "allDefense":
      return player.allDefense;
    case "dpoy":
      return player.dpoy;
    case "scoringTitle":
      return player.scoringTitle;
    case "ppg":
      return player.ppg;
    case "rpg":
      return player.rpg;
    case "apg":
      return player.apg;
    case "totalPoints":
      return player.totalPoints;
    case "playoffPPG":
      return player.playoffPPG;
    case "playoffWins":
      return player.playoffWins;
    case "peakPPG":
      return player.peakPPG;
    default:
      return 0;
  }
}

/**
 * 计算单个球员的综合评分
 */
export function calculatePlayerScore(
  player: PlayerData,
  weights: WeightConfig
): RankedPlayer {
  const breakdown: Record<string, number> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const key of Object.keys(weights) as (keyof WeightConfig)[]) {
    const weight = weights[key];
    if (weight === 0) continue;

    const rawValue = getPlayerValue(player, key);
    const maxValue = MAX_VALUES[key] || 1;
    const normalizedValue = normalize(rawValue, maxValue);
    const weightedScore = normalizedValue * (weight / 100);

    breakdown[key] = Math.round(normalizedValue * 10) / 10;
    totalWeightedScore += weightedScore;
    totalWeight += weight / 100;
  }

  const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;

  return {
    player,
    score: Math.round(finalScore * 10) / 10,
    breakdown,
  };
}

/**
 * 计算所有球员排名
 */
export function calculateRankings(
  players: PlayerData[],
  weights: WeightConfig
): RankedPlayer[] {
  return players
    .map((player) => calculatePlayerScore(player, weights))
    .sort((a, b) => b.score - a.score);
}