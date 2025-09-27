import { useEffect } from 'react';

// 页面标题映射
const pageTitles: Record<string, string> = {
    '/': '主页',
    '/news': '新闻',
    '/guide': '赛事规则',
    '/schedule': '赛程安排',
    '/mappool': '图池',
    '/registrations': '所有报名玩家',
    '/contact': '联系我们',
    '/photos': '历届荣誉展示',
    '/register': '注册登录',
    '/staff-dashboard': '工作人员仪表板',
};

// Hook for setting page title in client components
export function usePageTitle(pathname: string) {
    useEffect(() => {
        const title = pageTitles[pathname] || 'AstraCup 星域杯';
        document.title = title === 'AstraCup 星域杯' ? title : `${title} | AstraCup 星域杯`;
    }, [pathname]);
}