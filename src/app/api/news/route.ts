import { NextResponse } from 'next/server';
import { getNewsBySlug, getNewsSlugs } from '@/lib/utils';

export async function GET() {
    const slugs = await getNewsSlugs();
    const newsList = await Promise.all(
        slugs.map(async (slug) => {
            const news = await getNewsBySlug(slug);
            return { ...news, slug };
        })
    );
    return NextResponse.json(newsList);
}