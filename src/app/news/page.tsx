import { getNewsBySlug, getNewsSlugs, createSafeSlug } from '@/lib/utils';
import Link from 'next/link';
import { Metadata } from 'next';
import MainCard from '../components/ui/MainCard';

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
        <MainCard>

        <div className="max-w-5xl mx-auto mt-60 bg-white p-4 ">
            <header className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-gray-600">新闻中心</h1>
                <p className="text-gray-400">了解 AstraCup 星域杯的最新动态</p>
            </header>

            <div className="space-y-6">
                {newsList.map((news) => {
                    const link = `/news/${news.safeSlug}`;
                    return (
                        <Link
                            key={news.slug}
                            href={link}
                            className="border-b-4 border-blue-400 block bg-white p-6 hover:border-blue-600 hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.98] rounded-lg transition-all group"
                            style={{ textDecoration: 'none' }}
                        >
                            <article>
                                <header className="mb-3">
                                    <h2 className="text-xl font-semibold mb-2 text-gray-800 group-hover:font-bold">
                                        {news.frontmatter.title}
                                    </h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        {news.frontmatter.date && (
                                            <time>
                                                {new Date(news.frontmatter.date).toLocaleDateString('zh-CN')}
                                            </time>
                                        )}

                                    </div>
                                </header>
                                {news.frontmatter.description && (
                                    <p className="text-gray-500 mb-3 leading-relaxed">
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
        </MainCard>
    );
}
