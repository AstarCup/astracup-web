import { getMarkdownContent } from '@/lib/markdown';
import siteConfig from '@/config/site-config.json';

export default async function Guide() {
    const { contentHtml } = await getMarkdownContent(`src/app/${siteConfig.nowSeason}/guide.md`);

    return (
        <div className="max-w-5xl mx-auto p-6 text-white">
            <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
        </div>
    );
}