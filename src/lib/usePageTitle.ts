import { useEffect, useState } from "react";
import { useConfig } from "@/app/components/ConfigProvider";
import { pageTitles } from "@/app/layout";

// Hook for setting page title in client components
export function usePageTitle(pathname: string) {
  const { tournamentSettings } = useConfig();
  const [tournamentName, setTournamentName] = useState("AstraCup 星域杯");

  // 获取比赛名称
  useEffect(() => {
    if (tournamentSettings?.tournament_name) {
      setTournamentName(tournamentSettings.tournament_name);
    }
  }, [tournamentSettings]);

  // 页面标题映射
  const titles = pageTitles;

  useEffect(() => {
    const title = titles[pathname] || tournamentName;
    document.title =
      title === tournamentName ? title : `${title} | ${tournamentName}`;
  }, [pathname, tournamentName, titles]);
}
