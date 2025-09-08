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
                setNewsList(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6">加载中...</div>;

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