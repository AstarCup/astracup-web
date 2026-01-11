"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewsList() {
    const [newsList, setNewsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/news")
            .then(res => res.json())
            .then(data => {
                setNewsList(data.news);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6">加载中...</div>;

    return (
        <div className="max-w-5xl w-full">
            <header className="mb-8 relative flex flex-col items-left justify-center">
                <h2 className="text-6xl font-bold text-gray-600 absolute -top-0 -left-0">最新动态<Link
                    href="/news"
                    className="items-center text-blue-400 text-2xl hover:text-pink-400 transition-all hover:underline font-medium hover:font-bold"
                >
                    MORE〉</Link></h2>

            </header>

            <div className="space-y-6 mt-18 p-3">
                {newsList.map((news) => {
                    const link = `/news/${news.safeSlug || news.slug.replace('.md', '')}`;
                    return (
                        <Link
                            key={news.safeSlug || news.slug}
                            href={link}
                            className="block bg-gray-100 text-black-600 p-4 border-b-4 border-blue-400 rounded-lg hover:border-gray-600 hover:bg-gray-200 hover:text-white transition-all group active:scale-[0.99] hover:scale-[1.01]"
                            style={{ textDecoration: 'none' }}
                        >
                            <article>
                                <header className="">
                                    <h3 className="text-3xl font-semibold mb-2 text-gray-600">
                                        {news.frontmatter.title}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        {news.frontmatter.date && (
                                            <time>
                                                {new Date(news.frontmatter.date).toLocaleDateString('zh-CN')}
                                            </time>
                                        )}
                                    </div>
                                </header>
                                {news.frontmatter.description && (
                                    <p className="text-gray-600 font-bold mb-3 leading-relaxed">
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