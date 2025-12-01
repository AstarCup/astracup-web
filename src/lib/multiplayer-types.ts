// osu! multiplayer API 类型定义

export interface MultiplayerRoom {
    id: number;
    name: string;
    category: string;
    type: 'playlists' | 'realtime';
    starts_at: string | null;
    ends_at: string | null;
    max_attempts: number | null;
    participant_count: number;
    channel_id: number;
    active: boolean;
    has_password: boolean;
    queue_mode: 'all_players' | 'host_only' | 'all_players_round_robin';
    auto_skip: boolean;
    current_playlist_item: MultiplayerPlaylistItem | null;
    current_user_score: MultiplayerScore | null;
    host: {
        id: number;
        username: string;
        avatar_url: string;
    };
    playlist: MultiplayerPlaylistItem[];
}

export interface MultiplayerPlaylistItem {
    id: number;
    room_id: number;
    beatmap_id: number;
    ruleset_id: number;
    allowed_mods: MultiplayerMod[];
    required_mods: MultiplayerMod[];
    expired: boolean;
    owner_id: number;
    playlist_order: number;
    played_at: string | null;
    beatmap: {
        id: number;
        beatmapset_id: number;
        difficulty_rating: number;
        mode: string;
        status: string;
        total_length: number;
        user_id: number;
        version: string;
        accuracy: number;
        ar: number;
        bpm: number;
        convert: boolean;
        count_circles: number;
        count_sliders: number;
        count_spinners: number;
        cs: number;
        deleted_at: string | null;
        drain: number;
        hit_length: number;
        is_scoreable: boolean;
        last_updated: string;
        mode_int: number;
        passcount: number;
        playcount: number;
        ranked: number;
        url: string;
        checksum: string;
        beatmapset: {
            id: number;
            artist: string;
            artist_unicode: string;
            covers: {
                cover: string;
                'cover@2x': string;
                card: string;
                'card@2x': string;
                list: string;
                'list@2x': string;
                slimcover: string;
                'slimcover@2x': string;
            };
            creator: string;
            favourite_count: number;
            hype: string | null;
            nsfw: boolean;
            offset: number;
            play_count: number;
            preview_url: string;
            source: string;
            status: string;
            title: string;
            title_unicode: string;
            track_id: string | null;
            user_id: number;
            video: boolean;
        };
    };
}

export interface MultiplayerMod {
    acronym: string;
    settings: Record<string, any>;
}

export interface MultiplayerScore {
    id: number;
    user_id: number;
    room_id: number;
    playlist_item_id: number;
    beatmap_id: number;
    ruleset_id: number;
    passed: boolean;
    total_score: number;
    accuracy: number;
    max_combo: number;
    mods: MultiplayerMod[];
    statistics: {
        great?: number;
        ok?: number;
        meh?: number;
        miss?: number;
        ignore_hit?: number;
        large_tick_hit?: number;
        slider_tail_hit?: number;
        // 兼容旧字段
        count_300?: number;
        count_100?: number;
        count_50?: number;
        count_geki?: number;
        count_katu?: number;
        count_miss?: number;
    };
    rank: string;
    started_at: string | null;
    ended_at: string | null;
    best_id: number | null;
    pp: number | null;
    user: {
        id: number;
        username: string;
        avatar_url: string;
        country_code: string;
        is_online: boolean;
        is_bot: boolean;
        is_deleted: boolean;
    };
}

export interface MultiplayerScoresResponse {
    scores: MultiplayerScore[];
    user_score: MultiplayerScore | null;
    total: number;
    params: {
        limit: number;
        sort: string;
        cursor_string: string | null;
    };
}

// 用于前端展示的分数数据
export interface DisplayScore {
    user_id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    total_score: number;
    accuracy: number;
    max_combo: number;
    mods: string[];
    rank: string;
    passed: boolean;
    statistics: {
        count_300: number;
        count_100: number;
        count_50: number;
        count_miss: number;
    };
    pp: number | null;
    ended_at: string | null;
    position: number;
    // 添加beatmap信息用于匹配map selections
    beatmap_id?: number | null;
    beatmapset_id?: number | null;
    // 添加房间信息
    roomId?: number | string | null;
    roomName?: string | null;
    playlistId?: number | null;
}
