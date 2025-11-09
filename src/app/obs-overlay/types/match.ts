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
  id: 'red' | 'blue';
  name: string;
  score: number;
  avatarUrl?: string;
  playerName: string;
  player?: Player;
}

export interface MatchSettings {
  matchInfo: string;
  boFormat: 'BO3' | 'BO5' | 'BO7' | 'BO9' | 'BO11' | 'BO13';
  redTeamName: string;
  blueTeamName: string;
  redPlayer?: Player;
  bluePlayer?: Player;
}

export interface TimerState {
  remainingTime: number; // 剩余时间（秒）
  isRunning: boolean;    // 是否正在运行
}

export const BO_FORMAT_WIN_SCORE: Record<string, number> = {
  'BO3': 2,
  'BO5': 3,
  'BO7': 4,
  'BO9': 5,
  'BO11': 6,
  'BO13': 7,
};
