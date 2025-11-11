export interface BeatmapCard {
    id: number;
    beatmapId: number;
    beatmapsetId: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    selectedMods: string;
    modPosition: number;
    slot: string; // "NM1", "HD1", etc.
    coverUrl: string;
    starRating: number;
    // ban/pick状态
    status: 'available' | 'banned' | 'picked';
    bannedBy?: 'red' | 'blue';
    pickedBy?: 'red' | 'blue';
    bannedCount?: number;
    pickedCount?: number;
}

export interface BanPickState {
    currentTeam: 'red' | 'blue';
    currentAction: 'ban' | 'pick';
    remainingBans: { red: number; blue: number };
    remainingPicks: { red: number; blue: number };
    history: Array<{
        team: 'red' | 'blue';
        action: 'ban' | 'pick';
        beatmapId: number;
        modSlot: string; // 新增mod位信息，如 "NM1", "HD1" 等
        timestamp: number;
    }>;
}

export interface MapPoolSettings {
    season: string;
    category: string;
    visible: boolean;
}
