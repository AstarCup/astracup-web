import { getNewsBySlug, getNewsSlugs } from '@/lib/utils';
import Link from 'next/link';

export default async function NewsList() {
    const slugs = await getNewsSlugs();
    // 先并发获取所有新闻内容
    const newsList = await Promise.all(
        slugs.map(async (slug) => {
            const news = await getNewsBySlug(slug);
            return { ...news, slug };
        })
    );

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">新闻</h1>
            <ul className="space-y-4">
                {newsList.map((news) => (
                    <li key={news.slug}>
                        <Link
                            href={`/news/${news.slug}`}
                            className="text-xl text-[#F38181] hover:underline"
                        >
                            {news.frontmatter.title}
                        </Link>
                        <p className="text-gray-400">{news.frontmatter.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
