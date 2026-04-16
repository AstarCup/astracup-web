export interface MatchRoom {
  id: number;
  room_name: string;
  round_number: number;
  match_date: string;
  match_time: string;
  match_number: number;
  max_participants: number;
  status: "open" | "closed" | "in_progress";
  description: string;
  created_by: number;
  created_at: string;
  schedules?: {
    id: number;
    player1_osuId: number;
    player1_username: string;
    player1_avatar_url: string;
    player2_osuId: number;
    player2_username: string;
    player2_avatar_url: string;
    status: "scheduled" | "in_progress" | "completed";
    scheduled_time: string;
  }[];
}

export interface PlayerMatchup {
  id: number;
  player1_osuId: number;
  player1_username: string;
  player1_avatar_url: string;
  player2_osuId: number;
  player2_username: string;
  player2_avatar_url: string;
  status: "available" | "in_progress" | "completed";
  created_by: number;
  created_at: string;
}

export interface ApprovedPlayer {
  osuId: string;
  username: string;
  inGameName: string;
  avatar_url: string;
  pp: number;
  global_rank: number;
  country_rank: number;
  country: string;
}

export interface StaffRoomAssignment {
  id: number;
  room_id: number;
  staff_osuId: string;
  staff_username: string;
  staff_role: "referee" | "streamer" | "commentator";
  status: "pending" | "confirmed" | "declined";
  assigned_by: string;
  assigned_at: string;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
  room?: {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
  };
  staff_avatar_url?: string;
  match_info?: {
    id: number;
    player1_username: string;
    player2_username: string;
    scheduled_time: string;
    red_score?: number;
    blue_score?: number;
    match_link?: string;
    replay_link?: string;
    stream_link?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
  };
}

export interface AvailableRoom {
  id: number;
  room_name: string;
  round_number: number;
  match_date: string;
  match_time: string;
  match_number: number;
  status: "open" | "closed" | "in_progress";
  description?: string;
  player1_username?: string;
  player2_username?: string;
  staff_counts?: {
    referee: number;
    commentator: number;
    streamer: number;
  };
}
