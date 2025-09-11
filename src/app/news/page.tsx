import { getNewsBySlug, getNewsSlugs, createSafeSlug } from '@/lib/utils';
import Link from 'next/link';

export default async function NewsList() {
    const slugs = await getNewsSlugs();
    // 先并发获取所有新闻内容
    const newsList = await Promise.all(
        slugs.map(async (slug, index) => {
            const news = await getNewsBySlug(slug);
            return { 
                ...news, 
                slug,
                safeSlug: createSafeSlug(slug, index)
            };
        })
    );

    // 按日期排序（假设 frontmatter 中有 date 字段）
    newsList.sort((a, b) => {
        const dateA = new Date(a.frontmatter.date || '');
        const dateB = new Date(b.frontmatter.date || '');
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <div className="max-w-5xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-white">新闻中心</h1>
                <p className="text-gray-400">了解 AstraCup 星域杯的最新动态</p>
            </header>
            
            <div className="space-y-6">
                {newsList.map((news) => (
                    <article 
                        key={news.slug}
                        className="bg-[#3D3D3D] p-6 border border-gray-700 hover:border-[#E93B66] transition-colors"
                    >
                        <header className="mb-3">
                            <h2 className="text-xl font-semibold mb-2">
                                <Link
                                    href={`/news/${news.safeSlug}`}
                                    className="text-white hover:text-[#E93B66] transition-colors"
                                >
                                    {news.frontmatter.title}
                                </Link>
                            </h2>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                                {news.frontmatter.date && (
                                    <time>
                                        {new Date(news.frontmatter.date).toLocaleDateString('zh-CN')}
                                    </time>
                                )}
                                {news.frontmatter.author && (
                                    <span>作者: {news.frontmatter.author}</span>
                                )}
                            </div>
                        </header>
                        
                        {news.frontmatter.description && (
                            <p className="text-gray-300 mb-3 leading-relaxed">
                                {news.frontmatter.description}
                            </p>
                        )}
                        
                        <Link
                            href={`/news/${news.safeSlug}`}
                            className="inline-flex items-center text-[#E93B66] hover:text-[#F38181] transition-colors text-sm font-medium"
                        >
                            阅读全文
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </article>
                ))}
                
                {newsList.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">暂无新闻</p>
                    </div>
                )}
            </div>
        </div>
    );
}
