import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    context: { params: { matchId: string } } | { params: Promise<{ matchId: string }> }
) {
    let matchId: string | undefined;
    const params: any = context.params;
    if (typeof params.then === 'function') {
        // params 是 Promise
        matchId = (await params).matchId;
    } else {
        matchId = params.matchId;
    }
    if (!matchId) {
        return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    // 从cookie中读取session数据
    const cookieHeader = req.headers.get('cookie') || '';
    console.log('Cookie header:', cookieHeader);
    
    const sessionMatch = cookieHeader.match(/astra_session=([^;]+)/);
    
    if (!sessionMatch) {
        console.log('No astra_session cookie found');
        return NextResponse.json({ error: 'No osu! session found. Please login first.' }, { status: 401 });
    }
    
    let session;
    try {
        const sessionData = decodeURIComponent(sessionMatch[1]);
        console.log('Session data:', sessionData);
        session = JSON.parse(sessionData);
        console.log('Parsed session:', session);
    } catch (e) {
        console.log('Error parsing session:', e);
        return NextResponse.json({ error: 'Invalid session data' }, { status: 401 });
    }
    
    const accessToken = session.access_token;
    if (!accessToken) {
        console.log('No access token in session');
        return NextResponse.json({ error: 'No access token in session' }, { status: 401 });
    }
    
    console.log('Access token found, length:', accessToken.length);

    // osu! v2 API: https://osu.ppy.sh/docs/index.html#match-id
    const osuApiUrl = `https://osu.ppy.sh/api/v2/matches/${matchId}`;
    console.log('Calling osu! API:', osuApiUrl);
    
    try {
        const osuRes = await fetch(osuApiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        
        console.log('osu! API response status:', osuRes.status);
        
        if (!osuRes.ok) {
            const errorText = await osuRes.text();
            console.log('osu! API error response:', errorText);
            return NextResponse.json({ 
                error: `Failed to fetch from osu! API: ${osuRes.status}`,
                details: errorText 
            }, { status: osuRes.status });
        }
        
        const data = await osuRes.json();
        console.log('osu! API success, data keys:', Object.keys(data));
        return NextResponse.json(data);
    } catch (e) {
        console.error('Fetch error:', e);
        return NextResponse.json({ error: 'Internal server error', details: e }, { status: 500 });
    }
}
