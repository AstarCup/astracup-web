import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const NEWS_DIR = path.join(process.cwd(), 'src', 'app', 'news', 'content');

// 生成友好的 URL slug
export function generateSlug(filename: string): string {
    const nameWithoutExt = filename.replace('.md', '');
    // 为了避免 URL 编码问题，我们可以创建一个简单的映射
    // 或者使用文件的索引作为 slug
    return nameWithoutExt;
}

// 创建一个安全的 slug（避免中文字符问题）
export function createSafeSlug(filename: string, index: number): string {
    const nameWithoutExt = filename.replace('.md', '');
    // 如果文件名包含非 ASCII 字符，使用索引
    if (/[^\x00-\x7F]/.test(nameWithoutExt)) {
        return `news-${index + 1}`;
    }
    return nameWithoutExt;
}

// 从安全的 slug 获取文件名
export function getFilenameFromSlug(slug: string, allFiles: string[]): string {
    // 解码 URL 编码的字符
    const decodedSlug = decodeURIComponent(slug);
    
    // 首先尝试直接匹配
    const directMatch = allFiles.find(file => 
        file.replace('.md', '') === decodedSlug
    );
    if (directMatch) return directMatch;
    
    // 如果是 news-X 格式，通过索引查找
    const indexMatch = decodedSlug.match(/^news-(\d+)$/);
    if (indexMatch) {
        const index = parseInt(indexMatch[1]) - 1;
        if (index >= 0 && index < allFiles.length) {
            return allFiles[index];
        }
    }
    
    // 如果都找不到，抛出错误
    throw new Error(`无法找到对应的新闻文件: ${slug}`);
}

export function getNewsSlugs() {
    return fs.readdirSync(NEWS_DIR).filter(file => file.endsWith('.md'));
}

export function getNewsBySlug(slug: string) {
    // 如果 slug 不包含 .md 扩展名，则添加它
    const fileName = slug.endsWith('.md') ? slug : `${slug}.md`;
    const fullPath = path.join(NEWS_DIR, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const { data, content } = matter(fileContents);

    return {
        slug,
        frontmatter: data,
        content,
    };
}

export async function getNewsContent(slug: string) {
    // 获取所有文件列表
    const allFiles = getNewsSlugs();
    // 从 slug 获取正确的文件名
    const fileName = getFilenameFromSlug(slug, allFiles);
    
    const post = getNewsBySlug(fileName);
    const processedContent = await remark().use(html).process(post.content);
    const contentHtml = processedContent.toString();

    return {
        ...post,
        contentHtml,
    };
}
