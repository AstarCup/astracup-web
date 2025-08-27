// osu! OAuth2 配置
const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID || '';
const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET || '';

// 根据环境自动设置重定向URI
const getOsuRedirectUri = () => {
    // 在Vercel等生产环境中使用环境变量或自动检测
    if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
        return process.env.OSU_REDIRECT_URI || `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'rino.ink'}/api/auth/callback/osu`;
    }
    // 开发环境
    return process.env.OSU_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/osu';
};

const OSU_REDIRECT_URI = getOsuRedirectUri();

// 生成 osu! OAuth2 授权URL
export function getOsuAuthUrl(): string {
    if (!OSU_CLIENT_ID) {
        console.error('OSU_CLIENT_ID is not configured. Please set the OSU_CLIENT_ID environment variable.');
        throw new Error('OAuth configuration error: Client ID is missing');
    }

    if (!OSU_CLIENT_SECRET) {
        console.warn('OSU_CLIENT_SECRET is not configured. This may cause token exchange to fail.');
    }

    const params = new URLSearchParams({
        client_id: OSU_CLIENT_ID,
        redirect_uri: OSU_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify',
    });

    return `https://osu.ppy.sh/oauth/authorize?${params.toString()}`;
}

// 使用授权码获取访问令牌
export async function getOsuToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}> {
    try {
        console.log('Attempting token exchange with code:', code.substring(0, 10) + '...');
        console.log('Client ID:', OSU_CLIENT_ID ? 'SET' : 'NOT_SET');
        console.log('Client Secret:', OSU_CLIENT_SECRET ? 'SET' : 'NOT_SET');
        console.log('Redirect URI:', OSU_REDIRECT_URI);

        const response = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: OSU_CLIENT_ID,
                client_secret: OSU_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: OSU_REDIRECT_URI,
            }),
        });

        console.log('Token exchange response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', response.status, errorText);
            throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        console.log('Token exchange successful');
        return tokenData;
    } catch (error) {
        console.error('Token exchange error:', error);
        throw error;
    }
}

// 使用访问令牌获取用户信息
export async function getOsuUserInfo(accessToken: string): Promise<{
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    statistics?: {
        pp: number;
        global_rank: number | null;
        country_rank: number | null;
    };
}> {
    const response = await fetch('https://osu.ppy.sh/api/v2/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get user info');
    }

    const userData = await response.json();

    return {
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        country_code: userData.country_code,
        statistics: userData.statistics ? {
            pp: userData.statistics.pp,
            global_rank: userData.statistics.global_rank,
            country_rank: userData.statistics.country_rank,
        } : undefined,
    };
}

// 验证访问令牌
export async function verifyOsuToken(accessToken: string): Promise<boolean> {
    try {
        const response = await fetch('https://osu.ppy.sh/api/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}
