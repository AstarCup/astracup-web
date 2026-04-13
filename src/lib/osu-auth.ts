// osu! OAuth2 配置
const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID || '';
const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET || '';

// 根据环境自动设置重定向URI
const getOsuRedirectUri = () => {
    return 'https://asc.rino.ink/api/auth/callback/osu';
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
        scope: 'identify public',
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
        // console.log('Attempting token exchange with code:', code.substring(0, 10) + '...');
        // console.log('Client ID:', OSU_CLIENT_ID ? 'SET' : 'NOT_SET');
        // console.log('Client Secret:', OSU_CLIENT_SECRET ? 'SET' : 'NOT_SET');
        // console.log('Redirect URI:', OSU_REDIRECT_URI);

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

        // console.log('Token exchange response status:', response.status);
        // console.log('Token exchange response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', response.status, errorText);
            throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
        }

        try {
            const tokenData = await response.json();
            // console.log('Token exchange successful:', tokenData);
            return tokenData;
        } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            const responseText = await response.text();
            console.error('Response text:', responseText);
            throw new Error(`Failed to parse token response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
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
    cover?: {
        custom_url: string | null;
        url: string;
        id: string | null;
    };
    statistics?: {
        pp: number;
        global_rank: number | null;
        country_rank: number | null;
        country: string;
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
        cover: userData.cover ? {
            custom_url: userData.cover.custom_url || null,
            url: userData.cover.url || '',
            id: userData.cover.id || null,
        } : undefined,
        statistics: userData.statistics ? {
            pp: userData.statistics.pp,
            global_rank: userData.statistics.global_rank,
            country_rank: userData.statistics.country_rank,
            country: userData.country_code || '',
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
    } catch (_error) {
        return false;
    }
}

// 使用client_credentials流程获取应用级访问令牌（用于服务器端API调用）
export async function getOsuClientToken(): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
}> {
    try {
        console.log('Checking OSU_CLIENT_ID and OSU_CLIENT_SECRET...');
        if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
            throw new Error('OSU_CLIENT_ID and OSU_CLIENT_SECRET must be configured');
        }

        console.log('Requesting client token from osu API...');
        const response = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: OSU_CLIENT_ID,
                client_secret: OSU_CLIENT_SECRET,
                grant_type: 'client_credentials',
                scope: 'public'
            }),
        });

        console.log('Token request response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token request failed:', errorText);
            throw new Error(`Failed to get client token: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Token obtained successfully');
        return data;
    } catch (error) {
        console.error('Error getting client token:', error);
        throw error;
    }
}

// 缓存客户端token
let clientToken: { token: string; expires: number } | null = null;

// 获取有效的客户端token（带缓存）
export async function getValidClientToken(): Promise<string> {
    const now = Date.now() / 1000; // 当前时间戳（秒）

    console.log('Checking client token cache...');
    // 如果有缓存的token且未过期，返回缓存的token
    if (clientToken && clientToken.expires > now + 60) { // 提前60秒刷新
        console.log('Using cached client token');
        return clientToken.token;
    }

    console.log('Getting new client token...');
    // 获取新的token
    const tokenData = await getOsuClientToken();
    console.log('New token obtained, expires in:', tokenData.expires_in, 'seconds');
    clientToken = {
        token: tokenData.access_token,
        expires: now + tokenData.expires_in,
    };

    return clientToken.token;
}
