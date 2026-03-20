export type Player = {
  id: string;
  nameZh: string;
  nameEn: string;
  position?: string;
  active?: boolean;
  nbaId?: number | null;
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
  };
};

export type PlayerSeason = {
  playerId: string;
  season: string;
  gp: number;
  mp: number;
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  tpPct: number;
  tsPct: number;
  mvp?: number;
  fmvp?: number;
};

export type CompareMode = "career" | "season";
