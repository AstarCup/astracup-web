import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export async function getMarkdownContent(filePath: string) {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // 使用 gray-matter 解析前置元数据和内容
    const matterResult = matter(fileContents);
    
    // 使用 remark 将 markdown 转换为 HTML
    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    
    const contentHtml = processedContent.toString();
    
    return {
        contentHtml,
        data: matterResult.data,
    };
}
