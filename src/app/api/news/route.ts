
import { NextRequest, NextResponse } from 'next/server';
import { getNewsBySlug, getNewsSlugs, createSafeSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 3;

    const slugs = await getNewsSlugs();
    // 倒序排列，最新的在前
    slugs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    
    // 先为所有文件生成安全 slug
    const allNewsWithSafeSlug = slugs.map((slug, index) => ({
        slug,
        safeSlug: createSafeSlug(slug, index)
    }));
    
    // 然后进行分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = allNewsWithSafeSlug.slice(start, end);
    
    const newsList = await Promise.all(
        pageItems.map(async (item) => {
            const news = await getNewsBySlug(item.slug);
            return { 
                ...news, 
                slug: item.slug,
                safeSlug: item.safeSlug
            };
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