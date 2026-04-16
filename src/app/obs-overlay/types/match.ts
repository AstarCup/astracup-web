export interface Player {
  osuId: string;
  username: string;
  inGameName: string;
  avatar_url: string;
  pp: number;
  global_rank: number | null;
  country_rank: number | null;
  country: string;
  approved: boolean;
}

export interface Team {
  id: "red" | "blue";
  name: string;
  score: number;
  avatarUrl?: string;
  playerName: string;
  player?: Player;
}

export type MatchMode = "1v1" | "teamvs";

export interface MatchSettings {
  matchInfo: string;
  boFormat: "BO3" | "BO5" | "BO7" | "BO9" | "BO11" | "BO13";
  redTeamName: string;
  blueTeamName: string;
  redPlayer?: Player;
  bluePlayer?: Player;
  matchMode: MatchMode;
  showAvatars: boolean;
  redTeamAvatarUrl?: string;
  blueTeamAvatarUrl?: string;
  currencyEnabled: boolean;
  currencyName: string;
  redCurrency: number;
  blueCurrency: number;
}

export interface TimerState {
  remainingTime: number; // 剩余时间（秒）
  isRunning: boolean; // 是否正在运行
}

export interface RollState {
  isRolling: boolean; // 是否正在roll点
  isVisible: boolean; // 是否显示roll点界面
  redRoll: number; // 红队roll点结果
  blueRoll: number; // 蓝队roll点结果
  winner: "red" | "blue" | null; // 获胜队伍
  resultText: string; // 结果文本
  showResult: boolean; // 是否显示结果
  history: Array<{
    redRoll: number;
    blueRoll: number;
    winner: "red" | "blue";
    timestamp: number;
    resultText: string;
  }>; // roll点历史记录
}

export const BO_FORMAT_WIN_SCORE: Record<string, number> = {
  BO3: 2,
  BO5: 3,
  BO7: 4,
  BO9: 5,
  BO11: 6,
  BO13: 7,
};

export interface RefereeState {
  refereeText: string;
  nextAction: "pick" | "ban" | null; // 直接控制NextPick/NextBan显示
  nextTeam: "red" | "blue" | null;
  availableMaps: string[]; // 剩余可操作图池列表
  history: Array<{
    type: "score" | "text" | "nextAction" | "mapOperation";
    team?: "red" | "blue";
    action?: "pick" | "ban";
    content: string;
    timestamp: number;
    details?: {
      oldScore?: number;
      newScore?: number;
      mapSlot?: string;
    };
  }>;
}

export interface VictoryState {
  isVisible: boolean;
  winner: "red" | "blue" | null;
  hideScorePanel: boolean;
}

export interface OBSState {
  isConnected: boolean;
  scenes: string[];
  sceneMappings: {
    main: string;
    mapPool: string;
    victory: string;
  };
  currentScene: string;
}
