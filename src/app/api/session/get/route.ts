import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (!sessionCookie?.value) {
            const fallbackCookie = cookieStore.get('session');

            if (fallbackCookie?.value) {
                try {
                    const session = JSON.parse(fallbackCookie.value);
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

            return NextResponse.json({
                success: true,
                session: null
            });
        }

        try {
            const session = JSON.parse(sessionCookie.value);
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
        console.error('[Session Get API] 处理请求时发生错误:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve session'
        }, { status: 500 });
    }
}
