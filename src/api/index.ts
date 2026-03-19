// src/api/index.ts
// 前端 API 服务层 - 与 C++ 后端通信

const API_BASE = '/api';

// ====== Auth 相关类型 ======

export interface User {
  id: number;
  username: string;
  nickname: string;
  birthday: string;
  gender: string;
  avatar_url: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  nickname?: string;
  birthday?: string;
  gender?: string;
  avatar_url?: string;
}

// ====== 球员相关类型 ======

export interface PlayerData {
  id: number;
  nbaId: number;
  name: string;
  nameEn: string;
  position: string;
  era: string;
  teams: string[];
  avatar: string;
  isActive: boolean;
  hasDetailedStats: boolean;
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

export interface PlayerSearchParams {
  keyword?: string;
  position?: string;
  team?: string;
  activeOnly?: boolean;
  hasStatsOnly?: boolean;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PlayerSearchResult {
  players: PlayerData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

// 搜索球员（支持分页、筛选、排序）
export async function searchPlayers(params: PlayerSearchParams): Promise<PlayerSearchResult> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.position) searchParams.set('position', params.position);
  if (params.team) searchParams.set('team', params.team);
  if (params.activeOnly) searchParams.set('activeOnly', 'true');
  if (params.hasStatsOnly) searchParams.set('hasStatsOnly', 'true');
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDesc !== undefined) searchParams.set('sortDesc', String(params.sortDesc));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE}/players/search?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to search players');
  return res.json();
}

// 获取单个球员详情
export async function fetchPlayerDetail(nbaId: number): Promise<PlayerData> {
  const res = await fetch(`${API_BASE}/players/detail/${nbaId}`);
  if (!res.ok) throw new Error('Player not found');
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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers,
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

// ====== Auth API ======

// 注册
export async function register(
  username: string,
  password: string,
  nickname: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '注册失败' }));
    throw new Error(err.error || '注册失败');
  }
  return res.json();
}

// 登录
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '登录失败' }));
    throw new Error(err.error || '登录失败');
  }
  return res.json();
}

// 获取当前用户信息
export async function fetchCurrentUser(): Promise<User> {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('登录已过期');
  }
  return res.json();
}

// 获取当前用户完整资料
export async function fetchProfile(): Promise<User> {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '获取资料失败' }));
    throw new Error(err.error || '获取资料失败');
  }
  return res.json();
}

// 更新当前用户资料
export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '更新失败' }));
    throw new Error(err.error || '更新失败');
  }
  return res.json();
}
