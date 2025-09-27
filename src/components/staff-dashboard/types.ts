export interface Match {
    id: number;
    player1: string;
    player2: string;
    round: string;
    status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'in_progress';
    scheduled_time: string;
    referee?: string;
    streamer?: string;
    stream_link?: string;
    replay_link?: string;
    match_link?: string;
}

export interface Appointment {
    id: number;
    player_name: string;
    player_id: number;
    requested_time: string;
    status: 'pending' | 'approved' | 'rejected';
    match_id?: number;
    notes?: string;
}

export interface StaffMember {
    id: number;
    username: string;
    role: 'admin' | 'referee' | 'streamer';
}

export interface MatchRoom {
    id: number;
    name: string;
    status: 'available' | 'occupied' | 'maintenance';
    current_match?: number;
}

export interface PlayerMatchup {
    id: number;
    player1_id: number;
    player1_name: string;
    player2_id: number;
    player2_name: string;
    round: string;
    scheduled_time?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface StaffRoomAssignment {
    staff_id: number;
    room_id: number;
    assignment_time: string;
}

export interface TournamentRegistration {
    id: number;
    player_name: string;
    player_id: number;
    registration_time: string;
    status: 'pending' | 'approved' | 'rejected';
    discord_username?: string;
    osu_username?: string;
}

export interface ApprovedPlayer {
    id: number;
    player_name: string;
    player_id: number;
    approved_time: string;
    registration_id: number;
}

export interface MapSelection {
    id: number;
    beatmap_id: number;
    beatmap_title: string;
    beatmap_artist: string;
    creator: string;
    mods: string[];
    category: string;
    season: string;
    ratings: { user_id: number; rating: number }[];
    average_rating: number;
}