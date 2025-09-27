import { getNewsBySlug, getNewsSlugs, createSafeSlug } from '@/lib/utils';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "新闻 | AstraCup 星域杯",
    description: "AstraCup 是一场专为广大 osu!lazer std 玩家 打造的线上赛事。",
    icons: {
        icon: "/favicon.ico",
    },
};

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
        <div className="max-w-5xl mx-auto pt-10 ">
            <header className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-white">新闻中心</h1>
                <p className="text-gray-400">了解 AstraCup 星域杯的最新动态</p>
            </header>

            <div className="space-y-6">
                {newsList.map((news) => {
                    const link = `/news/${news.safeSlug}`;
                    return (
                        <Link
                            key={news.slug}
                            href={link}
                            className="border-b-4 border-[#E93B66] block bg-[#3D3D3D] p-6 hover:border-[#3BE9D8] transition-colors group"
                            style={{ textDecoration: 'none' }}
                        >
                            <article>
                                <header className="mb-3">
                                    <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-[#3BE9D8] transition-colors">
                                        {news.frontmatter.title}
                                    </h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                                        {news.frontmatter.date && (
                                            <time>
                                                {new Date(news.frontmatter.date).toLocaleDateString('zh-CN')}
                                            </time>
                                        )}

                                    </div>
                                </header>
                                {news.frontmatter.description && (
                                    <p className="text-gray-300 mb-3 leading-relaxed">
                                        {news.frontmatter.description}
                                    </p>
                                )}

                            </article>
                        </Link>
                    );
                })}

                {newsList.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">暂无新闻</p>
                    </div>
                )}
            </div>
        </div>
    );
}
