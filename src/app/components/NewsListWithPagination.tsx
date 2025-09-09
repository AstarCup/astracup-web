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
            <h1 className="text-3xl font-bold mb-6 text-white">新闻</h1>
            <ul className="space-y-4">
                {newsList.map((news) => (
                    <li key={news.slug}>
                        <Link
                            href={`/news/${news.slug}`}
                            className="text-xl text-[#E93B66] font-bold hover:underline"
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