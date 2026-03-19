export interface PlayerData {
    id: number;
    nbaId: number;
    name: string;
    nameEn: string;
    position: string;
    era: string;
    teams: string[];
    avatar: string; // emoji代替头像，先不用图片
    isActive: boolean;
    hasDetailedStats: boolean;
    
    // 荣誉
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
    roy: number; // 最佳新秀
    
    // 常规赛生涯数据
    gamesPlayed: number;
    ppg: number;  // 场均得分
    rpg: number;  // 场均篮板
    apg: number;  // 场均助攻
    spg: number;  // 场均抢断
    bpg: number;  // 场均盖帽
    fgPct: number; // 命中率
    totalPoints: number;
    
    // 季后赛数据
    playoffPPG: number;
    playoffRPG: number;
    playoffAPG: number;
    playoffWins: number;
    playoffLosses: number;
    
    // 巅峰赛季
    peakPPG: number;
    peakSeason: string;
  }
  
// 从 JSON 文件导入真实球员数据
import playersData from './players.json';

export const players: PlayerData[] = playersData as PlayerData[];
