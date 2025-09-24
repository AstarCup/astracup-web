import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
    try {
        // 尝试获取git commit sha
        const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        return NextResponse.json({ commitSha });
    } catch (error) {
        // 如果获取不到git信息，返回null
        console.warn('Failed to get git commit sha:', error);
        return NextResponse.json({ commitSha: null });
    }
}