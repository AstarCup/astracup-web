import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function GET() {
    // 获取整个 config 或只获取 targetDate
    const targetDate = await get<string>('targetDate');
    return NextResponse.json({ targetDate });
}