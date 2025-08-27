// app/news/[slug]/page.tsx
import Link from 'next/link';
import { getNewsContent } from '@/lib/utils';

export default async function NewsPost({ params }: { params: { slug: string } }) {
    const paramsSlug = await params;
    const news = await getNewsContent(paramsSlug.slug);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Link
                href="/news"
                className="pt-10 text-xl text-[#F38181] hover:underline"
            >
                返回
            </Link>
            <h1 className="text-3xl font-bold mb-4 mt-10">{news.frontmatter.title}</h1>
            <p className="text-gray-400 text-sm mb-6">{news.frontmatter.date}</p>
            <div
                className="prose prose-invert prose-lg text-black mb-10"
                dangerouslySetInnerHTML={{ __html: news.contentHtml }}
            />
            <Link
                href="/news"
                className="text-xl text-[#F38181] hover:underline"
            >
                返回
            </Link>
        </div>
    );
}
