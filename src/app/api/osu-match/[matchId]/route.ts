import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
    const { matchId } = params;
    if (!matchId) {
        return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    // 从cookie读取access_token，假设cookie名为'cookiez'
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/cookiez=([^;]+)/);
    const accessToken = match ? decodeURIComponent(match[1]) : '';
    if (!accessToken) {
        return NextResponse.json({ error: 'No osu! access token in cookiez' }, { status: 401 });
    }

    // osu! v2 API: https://osu.ppy.sh/docs/index.html#match-id
    const osuApiUrl = `https://osu.ppy.sh/api/v2/matches/${matchId}`;
    try {
        const osuRes = await fetch(osuApiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!osuRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch from osu! API' }, { status: osuRes.status });
        }
        const data = await osuRes.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
