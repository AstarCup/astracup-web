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
        <div className="max-w-5xl w-full p-6">
            <header className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-white">最新动态</h2>

            </header>

            <div className="space-y-6">
                {newsList.map((news) => {
                    const link = `/news/${news.safeSlug || news.slug.replace('.md', '')}`;
                    return (
                        <Link
                            key={news.safeSlug || news.slug}
                            href={link}
                            className="block bg-[#3D3D3D] p-6 border border-[#E93B66] hover:border-[#3BE9D8] transition-colors group"
                            style={{ textDecoration: 'none' }}
                        >
                            <article>
                                <header className="mb-3">
                                    <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#3BE9D8] transition-colors">
                                        {news.frontmatter.title}
                                    </h3>
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

            <div className="mt-8 text-left">
                <Link
                    href="/news"
                    className="inline-flex items-center px-6 py-3 bg-[#E93B66] text-white hover:bg-[#3BE9D8] transition-colors font-medium"
                >
                    查看所有新闻
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}