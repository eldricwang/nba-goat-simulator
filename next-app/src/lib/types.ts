export type Player = {
  id: string;
  nameZh: string;
  nameEn: string;
  position?: string | null;
  active?: boolean;
  nbaId?: number | null;

  /** 球员资料页扩展字段（Week 2） */
  heightCm?: number | null;
  weightKg?: number | null;
  birthDate?: string | null; // ISO date, e.g. "1984-12-30"
  country?: string | null;
  draftYear?: number | null;
  draftRound?: number | null;
  draftPick?: number | null;
  currentTeam?: string | null;
  jerseyNumber?: string | null;
  fromYear?: number | null;
  toYear?: number | null;

  career: {
    gp: number;
    mp: number;
    pts: number;
    reb: number;
    ast: number;
    fgPct: number;
    tpPct: number | null;
    tsPct: number | null;
    mvp: number;
    fmvp: number;
    stl?: number | null;
    blk?: number | null;
    tov?: number | null;
    rings?: number;
  };
};

export type PlayerSeason = {
  playerId: string;
  season: string;
  team?: string | null;
  gp: number;
  mp: number;
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  tpPct: number;
  tsPct: number;
  stl?: number | null;
  blk?: number | null;
  tov?: number | null;
  oreb?: number | null;
  dreb?: number | null;
  pf?: number | null;
  ftPct?: number | null;
  mvp?: number;
  fmvp?: number;
};

export type CompareMode = "career" | "season";
