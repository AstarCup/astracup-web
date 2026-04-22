"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserProfile from "./components/ui/UserProfile";
import RegistrationButton from "./components/ui/RegistrationButton";
import NewsListWithPagination from "./components/ui/NewsListWithPagination";
import NewStyleLogo from "./components/icons/NewStyleLogo";
import { useConfig } from "./components/ConfigProvider";
import { BookMarked, CalendarDays, Table2, Contact } from "lucide-react";
import Link from "next/link";
import WinnersCanvas from "./components/ui/WinnersCanvas";
import { UserSession } from "@/lib/permissions";

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { tournamentSettings } = useConfig();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  useEffect(() => {
    fetch("/api/session/get", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Session data received:", data);
        console.log("data.data:", data.data);
        console.log("data.data?.session:", data.data?.session);

        if (data.success && data.data) {
          const session = data.data.session || data.data;
          console.log("Extracted session:", session);

          if (session && typeof session === "object" && session.osuId) {
            const userSession = {
              osuId: session.osuId || "",
              username: session.username || "未知用户",
              avatar_url: session.avatar_url || "",
              pp: session.pp || 0,
              global_rank: session.global_rank || null,
              country_rank: session.country_rank || null,
              country: session.country || "",
              cover: session.cover,
            };
            console.log("Processed user session:", userSession);
            setUser(userSession);
          } else {
            console.log("Session data is invalid:", session);
            setUser(null);
          }
        } else {
          console.log("No active session found");
          setUser(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch user session:", error);
        setUser(null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="text-text min-h-screen transition-colors duration-300">
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-full max-w-7xl flex flex-col items-left justify-center px-4 sm:px-6 mt-4">
          <div className="relative w-full flex flex-col items-left justify-center px-4 sm:px-6">
            <div className="relative w-full flex justify-end items-right mt-40">
              <NewStyleLogo className="scale-75 bottom-0" />
            </div>
          </div>
          <div></div>
          <div className="w-full z-10 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {!user ? (
                <a
                  href="/register"
                  className="p-6 col-span-2 flex flex-col rounded-lg bg-white dark:bg-white-extra items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] hover:scale-[1.01]"
                >
                  <span
                    className="text-3xl font-bold text-text absolute right-2 bottom-2 pointer-events-none"
                    style={{ zIndex: 2 }}
                  >
                    报名登录
                  </span>
                </a>
              ) : (
                <RegistrationButton user={user} />
              )}
              <Link
                href="/guide"
                className="p-3 flex flex-col rounded-lg bg-white dark:bg-white-extra items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <BookMarked color="#E93B66" />
                </span>
                <span
                  className="text-3xl font-bold text-text absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}
                >
                  比赛手册
                </span>
              </Link>
              <Link
                href="/schedule"
                className="p-3 flex flex-col rounded-lg bg-white dark:bg-white-extra items-left justify-end transition-all group relative border-b-4 border-yellow-400 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <CalendarDays color="#F8D211" />
                </span>
                <span
                  className="text-3xl text-text font-bold absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}
                >
                  赛程安排
                </span>
              </Link>

              <Link
                href="/mappool"
                className="p-3 flex flex-col rounded-lg bg-white dark:bg-white-extra items-left justify-end transition-all group relative border-b-4 border-orange-400 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <Table2 color="orange" />
                </span>
                <span
                  className="text-3xl font-bold text-text absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}
                >
                  图池
                </span>
              </Link>
              <Link
                href="/contact"
                className="p-3 flex flex-col rounded-lg bg-white dark:bg-white-extra items-left justify-end transition-all group relative border-b-4 border-blue-400 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <Contact color="#3BB8E9" />
                </span>
                <span
                  className="text-3xl font-bold text-text absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}
                >
                  联系我们
                </span>
              </Link>
              {!user ? (
                <div></div>
              ) : (
                <div className="col-span-2 flex flex-row w-full gap-2 items-end justify-between">
                  <Link
                    href="https://qm.qq.com/q/sFydxoQtaw"
                    className="p-3 text-xl relative group font-bold text-text text-right flex w-full flex-col rounded-lg bg-white dark:bg-white-extra justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    QQ Group
                    <Image
                      src={"/QQGroupQRcode.png"}
                      alt="QQ Group QRcode"
                      width={300}
                      height={300}
                      className="bg-white p-5 rounded-lg w-full absolute bottom-15 right-0 z-3 invisible group-hover:visible"
                    />
                  </Link>
                  <Link
                    href="https://space.bilibili.com/11872433"
                    className="p-3 text-xl font-bold text-text text-right flex w-full flex-col rounded-lg bg-white dark:bg-white-extra justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Bilibili
                  </Link>
                  <Link
                    href="https://live.bilibili.com/725565"
                    className="p-3 text-xl font-bold text-text text-right flex w-full flex-col rounded-lg bg-white dark:bg-white-extra justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Live
                  </Link>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text mt-4">第一赛季</h1>
            </div>
          </div>

        </div>
        <div className="mt-8 w-full">
          <WinnersCanvas showControls={false} defaultSeason="s1" height="1000px" />
        </div>
        <div className="relative w-full max-w-7xl flex flex-col items-left justify-center px-4 sm:px-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 mt-4 gap-4 w-full z-0 relative">
            <div className="bg-white dark:bg-white-extra rounded-lg p-3 z-2">
              <div className="overflow-y-auto">
                <NewsListWithPagination />
              </div>
            </div>



          </div>

        </div>
      </div>
    </div>
  );
}
