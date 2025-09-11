// app/news/[slug]/page.tsx
import Link from 'next/link';
import { getNewsContent } from '@/lib/utils';

export default async function NewsPost({ params }: { params: { slug: string } }) {
    const paramsSlug = await params;
    const news = await getNewsContent(paramsSlug.slug);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-[#3D3D3D]">
            <Link
                href="/news"
                className="inline-block pt-10 text-lg text-[#E93B66] hover:text-[#ffffff] transition-colors"
            >
                ← 返回新闻列表
            </Link>
            
            <article className="mt-8">
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
                        {news.frontmatter.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-gray-400">
                        <time className="text-sm">
                            {news.frontmatter.date}
                        </time>
                        {news.frontmatter.author && (
                            <span className="text-sm">
                                作者: {news.frontmatter.author}
                            </span>
                        )}
                    </div>
                </header>
                
                <div
                    className="prose prose-lg prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: news.contentHtml }}
                />
            </article>
            
            <footer className="mt-12 pt-8 border-t border-gray-700">
                <Link
                    href="/news"
                    className="inline-block text-lg text-[#E93B66] hover:text-[#ffffff] transition-colors"
                >
                    ← 返回新闻列表
                </Link>
            </footer>
        </div>
    );
}
