import { getMarkdownContent } from '@/lib/markdown';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');

        if (!season) {
            return NextResponse.json({ error: 'Season parameter is required' }, { status: 400 });
        }

        const { contentHtml } = await getMarkdownContent(`src/app/${season}/guide.md`);

        return NextResponse.json({ contentHtml });
    } catch (error) {
        console.error('Error fetching guide content:', error);
        return NextResponse.json({ error: 'Failed to fetch guide content' }, { status: 500 });
    }
}