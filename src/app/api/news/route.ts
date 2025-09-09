
import { NextRequest, NextResponse } from 'next/server';
import { getNewsBySlug, getNewsSlugs } from '@/lib/utils';

export async function GET(req: NextRequest) {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 5;

    const slugs = await getNewsSlugs();
    // 倒序排列，最新的在前
    slugs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageSlugs = slugs.slice(start, end);
    const newsList = await Promise.all(
        pageSlugs.map(async (slug) => {
            const news = await getNewsBySlug(slug);
            return { ...news, slug };
        })
    );
    return NextResponse.json({
        news: newsList,
        page,
        pageSize,
        total: slugs.length,
        totalPages: Math.ceil(slugs.length / pageSize),
    });
}