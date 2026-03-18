// src/api/index.ts
// 前端 API 服务层 - 与 C++ 后端通信

const API_BASE = '/api';

export interface PlayerData {
  id: number;
  name: string;
  nameEn: string;
  position: string;
  era: string;
  teams: string[];
  avatar: string;
  championships: number;
  mvp: number;
  fmvp: number;
  allStar: number;
  allNBA1st: number;
  allNBA2nd: number;
  allNBA3rd: number;
  allDefense: number;
  dpoy: number;
  scoringTitle: number;
  assistTitle: number;
  reboundTitle: number;
  allStarMVP: number;
  roy: number;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  totalPoints: number;
  playoffPPG: number;
  playoffRPG: number;
  playoffAPG: number;
  playoffWins: number;
  playoffLosses: number;
  peakPPG: number;
  peakSeason: string;
}

export interface RankedPlayer {
  player: PlayerData;
  score: number;
  breakdown: Record<string, number>;
}

export interface WeightConfig {
  championships: number;
  mvp: number;
  fmvp: number;
  allStar: number;
  allNBA: number;
  allDefense: number;
  dpoy: number;
  scoringTitle: number;
  ppg: number;
  rpg: number;
  apg: number;
  totalPoints: number;
  playoffPPG: number;
  playoffWins: number;
  peakPPG: number;
}

export interface WeightPreset {
  name: string;
  emoji: string;
  description: string;
  weights: WeightConfig;
}

export interface Comment {
  id: string;
  nickname: string;
  content: string;
  team_name: string | null;
  created_at: string;
}

// 获取所有球员数据
export async function fetchPlayers(): Promise<PlayerData[]> {
  const res = await fetch(`${API_BASE}/players`);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

// 根据权重计算排名
export async function fetchRankings(weights: WeightConfig): Promise<RankedPlayer[]> {
  const res = await fetch(`${API_BASE}/rankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  });
  if (!res.ok) throw new Error('Failed to fetch rankings');
  return res.json();
}

// 获取预设权重方案
export async function fetchPresets(): Promise<WeightPreset[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

// 获取评论列表
export async function fetchComments(): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

// 发表评论
export async function postComment(
  nickname: string,
  content: string,
  teamName?: string
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      content,
      team_name: teamName || '',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to post comment');
  }
  return res.json();
}
