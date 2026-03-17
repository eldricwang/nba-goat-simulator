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
  
  export const DEFAULT_WEIGHTS: WeightConfig = {
    championships: 70,
    mvp: 65,
    fmvp: 60,
    allStar: 25,
    allNBA: 35,
    allDefense: 20,
    dpoy: 30,
    scoringTitle: 25,
    ppg: 40,
    rpg: 20,
    apg: 20,
    totalPoints: 30,
    playoffPPG: 45,
    playoffWins: 35,
    peakPPG: 35,
  };
  
  export const WEIGHT_PRESETS: WeightPreset[] = [
    {
      name: "均衡模式",
      emoji: "⚖️",
      description: "各维度均衡考量",
      weights: { ...DEFAULT_WEIGHTS },
    },
    {
      name: "冠军至上",
      emoji: "💍",
      description: "总冠军和FMVP权重最高",
      weights: {
        ...DEFAULT_WEIGHTS,
        championships: 100,
        fmvp: 90,
        mvp: 50,
        playoffWins: 70,
        playoffPPG: 60,
        ppg: 20,
        allStar: 10,
      },
    },
    {
      name: "数据为王",
      emoji: "📊",
      description: "个人数据和统计至上",
      weights: {
        ...DEFAULT_WEIGHTS,
        ppg: 90,
        totalPoints: 85,
        rpg: 60,
        apg: 60,
        peakPPG: 80,
        championships: 30,
        mvp: 40,
        fmvp: 30,
      },
    },
    {
      name: "荣誉收割",
      emoji: "🏅",
      description: "MVP、全明星等个人荣誉优先",
      weights: {
        ...DEFAULT_WEIGHTS,
        mvp: 100,
        allStar: 70,
        allNBA: 80,
        dpoy: 60,
        scoringTitle: 60,
        championships: 40,
        ppg: 30,
      },
    },
    {
      name: "季后赛之王",
      emoji: "⚔️",
      description: "季后赛表现决定一切",
      weights: {
        ...DEFAULT_WEIGHTS,
        playoffPPG: 100,
        playoffWins: 90,
        championships: 85,
        fmvp: 85,
        ppg: 20,
        allStar: 10,
        mvp: 30,
      },
    },
    {
      name: "科密专用",
      emoji: "🐍",
      description: "曼巴精神！防守+冠军+巅峰",
      weights: {
        ...DEFAULT_WEIGHTS,
        championships: 90,
        allDefense: 80,
        fmvp: 85,
        peakPPG: 90,
        scoringTitle: 70,
        playoffPPG: 80,
        mvp: 30,
        totalPoints: 20,
        apg: 5,
      },
    },
    {
      name: "詹密专用",
      emoji: "👑",
      description: "全能+长青+总数据",
      weights: {
        ...DEFAULT_WEIGHTS,
        totalPoints: 100,
        apg: 80,
        rpg: 70,
        allNBA: 90,
        allStar: 70,
        playoffWins: 80,
        mvp: 70,
        championships: 50,
        scoringTitle: 20,
      },
    },
  ];
  
  export const WEIGHT_LABELS: Record<keyof WeightConfig, string> = {
    championships: "🏆 总冠军",
    mvp: "🏅 常规赛MVP",
    fmvp: "🏅 总决赛MVP",
    allStar: "⭐ 全明星次数",
    allNBA: "📋 最佳阵容",
    allDefense: "🛡️ 最佳防守阵容",
    dpoy: "🛡️ 最佳防守球员",
    scoringTitle: "👑 得分王",
    ppg: "📊 场均得分",
    rpg: "📊 场均篮板",
    apg: "📊 场均助攻",
    totalPoints: "📈 生涯总得分",
    playoffPPG: "⚔️ 季后赛场均得分",
    playoffWins: "⚔️ 季后赛胜场",
    peakPPG: "🔥 巅峰赛季得分",
  };
  
  // 权重分组（用于UI展示）
  export const WEIGHT_GROUPS = [
    {
      name: "🏆 荣誉成就",
      keys: ["championships", "mvp", "fmvp", "dpoy", "scoringTitle"] as (keyof WeightConfig)[],
    },
    {
      name: "⭐ 生涯荣誉",
      keys: ["allStar", "allNBA", "allDefense"] as (keyof WeightConfig)[],
    },
    {
      name: "📊 常规赛数据",
      keys: ["ppg", "rpg", "apg", "totalPoints"] as (keyof WeightConfig)[],
    },
    {
      name: "⚔️ 季后赛 & 巅峰",
      keys: ["playoffPPG", "playoffWins", "peakPPG"] as (keyof WeightConfig)[],
    },
  ];
