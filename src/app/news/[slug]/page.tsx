// app/news/[slug]/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { getNewsContent } from '@/lib/utils';

export default async function NewsPost({ params }: { params: { slug: string } }) {
    const paramsSlug = await params;
    const news = await getNewsContent(paramsSlug.slug);

    return (
        <div className="max-w-4xl mx-auto p-6">


            <article className="">
                <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-2 relative" style={{ overflow: 'visible' }}>

                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight m-0 pl-6 relative" style={{ zIndex: 2, display: 'inline-block' }}>
                        <span style={{ position: 'relative', zIndex: 2 }}>{news.frontmatter.title}</span>
                        <span style={{ position: 'absolute', left: '-240px', top: '-115px', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
                            <Image src="/title.svg" alt="TitleBackground" width={630} height={390} style={{ overflow: 'visible' }} />
                        </span>
                    </h1>
                    <p className='text-white text-base md:text-lg md:ml-6 mb-1 md:mb-0' style={{ zIndex: 2 }}>{news.frontmatter.date}</p>
                </header>

                <div
                    className="prose prose-lg prose-invert max-w-none bg-[#3D3D3D] p-6"
                    dangerouslySetInnerHTML={{ __html: news.contentHtml }}
                />
            </article>

            <footer className="mt-12 pt-8 border-t border-gray-700">
                <Link
                    href="/news"
                    className="inline-block text-lg text-[#E93B66] hover:text-[#ffffff] transition-colors pl-6"
                >
                    ← Back
                </Link>
            </footer>
        </div>
    );
}
