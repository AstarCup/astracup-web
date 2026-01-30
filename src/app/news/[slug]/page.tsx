import Link from 'next/link';
import { getNewsContent } from '@/lib/utils';
import MainCard from '@/app/components/ui/MainCard';
import { CircleChevronLeft } from 'lucide-react';

export default async function NewsPost({ params }: { params: { slug: string } }) {
    const paramsSlug = await params;
    const news = await getNewsContent(paramsSlug.slug);

    return (
        <MainCard>
            <article>
                <header className="flex flex-col gap-2 relative" style={{ overflow: 'visible' }}>
                    <div className='flex flex-row'>
                        <Link
                            href="/news"
                            className="flex flex-row gap-4 hover:smooth-bounce w-max hover:scale-101 active:scale-95 hover:peer text-2xl items-top text-[#E93B66] hover:font-bold  transition-all pl-6"
                            >
                            <CircleChevronLeft size={50} />
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-600 leading-tight m-0 pl-6 relative" style={{ zIndex: 2, display: 'inline-block' }}>
                            <span style={{ position: 'relative', zIndex: 2 }}>{news.frontmatter.title}</span>
                        </h1>
                    </div>
                    <p className='text-gray-600 text-base md:text-lg md:ml-6 mb-1 md:mb-0' style={{ zIndex: 2 }}>{news.frontmatter.date}</p>
                </header>
                <div
                    className="prose prose-lg prose-invert max-w-none p-6 text-gray-600"
                    dangerouslySetInnerHTML={{ __html: news.contentHtml }}
                />
            </article>
        </MainCard>
    );
}
