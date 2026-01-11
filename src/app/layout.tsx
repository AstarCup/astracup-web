import { ConfigProvider } from './components/ConfigProvider';
import { AppContent } from './components/AppContent';
import "./globals.css";

// 页面标题映射
export const pageTitles: Record<string, string> = {
  '/': '主页',
  '/news': '新闻',
  '/guide': '赛事规则',
  '/schedule': '赛程安排',
  '/mappool': '图池',
  '/registrations': '所有报名玩家',
  '/contact': '联系我们',
  '/photos': '历届荣誉展示',
  '/register': '注册登录',
  '/map-selection': '地图选择',
  '/replay-collection': '回放收集',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="zh">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
      <body className={`antialiased`}>
        <ConfigProvider>
          <AppContent>
            {children}
          </AppContent>
        </ConfigProvider>
      </body>
    </html>
  );
}
