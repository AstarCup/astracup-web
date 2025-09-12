import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkEmoji from 'remark-emoji';

export async function getMarkdownContent(filePath: string) {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // 使用 gray-matter 解析前置元数据和内容
    const matterResult = matter(fileContents);
    
    // 使用 remark 将 markdown 转换为 HTML，支持扩展语法
    const processedContent = await remark()
        .use(remarkGfm)      // GitHub Flavored Markdown (表格、删除线、任务列表等)
        .use(remarkBreaks)   // 支持软换行
        .use(remarkEmoji)    // 支持emoji
        .use(html, {
            sanitize: false  // 允许HTML标签
        })
        .process(matterResult.content);
    
    const contentHtml = processedContent.toString();
    
    return {
        contentHtml,
        data: matterResult.data,
    };
}
