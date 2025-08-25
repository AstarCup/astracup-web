import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const NEWS_DIR = path.join(process.cwd(), 'src', 'app', 'news', 'content');

export function getNewsSlugs() {
    return fs.readdirSync(NEWS_DIR).filter(file => file.endsWith('.md'));
}

export function getNewsBySlug(slug: string) {
    const fullPath = path.join(NEWS_DIR, `${slug}`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const { data, content } = matter(fileContents);

    return {
        slug,
        frontmatter: data,
        content,
    };
}

export async function getNewsContent(slug: string) {
    const post = getNewsBySlug(slug);
    const processedContent = await remark().use(html).process(post.content);
    const contentHtml = processedContent.toString();

    return {
        ...post,
        contentHtml,
    };
}
