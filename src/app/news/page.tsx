import { getNewsBySlug, getNewsSlugs } from '@/lib/utils';
import Link from 'next/link';

export default function NewsList() {
    const slugs = getNewsSlugs();

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">新闻</h1>
            <ul className="space-y-4">
                {slugs.map((slug) => {
                    const news = getNewsBySlug(slug);
                    return (
                        <li key={slug}>
                            <Link href={`/news/${slug}`} className="text-xl text-[#F38181] hover:underline">
                                {news.frontmatter.title}
                            </Link>
                            <p className="text-gray-400">{news.frontmatter.description}</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
