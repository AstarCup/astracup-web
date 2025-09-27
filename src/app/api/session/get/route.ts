import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        console.log('[Session Get API] 检查astra_session cookie:', !!sessionCookie?.value);

        if (!sessionCookie?.value) {
            console.log('[Session Get API] astra_session cookie不存在，检查session cookie');
            const fallbackCookie = cookieStore.get('session');
            console.log('[Session Get API] session cookie存在:', !!fallbackCookie?.value);

            if (fallbackCookie?.value) {
                try {
                    const session = JSON.parse(fallbackCookie.value);
                    console.log('[Session Get API] 使用session cookie，解析成功:', session.osuId);
                    return NextResponse.json({
                        success: true,
                        session: session
                    });
                } catch (parseError) {
                    console.error('[Session Get API] session cookie解析失败:', parseError);
                    return NextResponse.json({
                        success: true,
                        session: null
                    });
                }
            }

            console.log('[Session Get API] 没有找到有效的session cookie');
            return NextResponse.json({
                success: true,
                session: null
            });
        }

        // console.log('Session cookie found:', sessionCookie.value);

        try {
            const session = JSON.parse(sessionCookie.value);
            console.log('[Session Get API] astra_session cookie解析成功:', session.osuId);
            return NextResponse.json({
                success: true,
                session: session
            });
        } catch (parseError) {
            console.error('[Session Get API] astra_session cookie解析失败:', parseError);
            return NextResponse.json({
                success: true,
                session: null
            });
        }
    } catch (error) {
        console.error('Error retrieving session:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve session'
        }, { status: 500 });
    }
}
