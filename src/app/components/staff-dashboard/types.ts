export interface Match {
    id: string;
    round: string;
    date: string;
    time: string;
    matchNumber: string;
    player1Id?: string;
    player2Id?: string;
    player1Name?: string;
    player2Name?: string;
    redScore?: number;
    blueScore?: number;
    status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
    streamLink?: string;
    replayLink?: string;
    matchLink?: string;
    referee?: string;
    streamer?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Appointment {
    id: string;
    matchId: string;
    playerId: string;
    playerName: string;
    opponentId?: string;
    opponentName?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

export interface StaffMember {
    id: string;
    username: string;
    role: 'referee' | 'streamer' | 'admin';
}