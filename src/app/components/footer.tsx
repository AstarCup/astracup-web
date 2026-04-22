"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowBigUpDash } from "lucide-react";

export default function Footer() {
  const [version, setVersion] = useState("loading...");
  const [isVisible, setIsVisible] = useState(false);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      // 当页面滚动超过200px时显示按钮
      const shouldShow = window.scrollY > 200;
      setIsVisible(shouldShow);
    };

    // 添加滚动事件监听
    window.addEventListener("scroll", handleScroll);

    // 初始检查一次
    handleScroll();

    // 清理函数
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch("/api/version");
        const data = await response.json();
        setVersion(data.version);
      } catch (error) {
        console.error("Failed to fetch version:", error);
        setVersion("unknown");
      }
    };

    fetchVersion();
  }, []);
  return (
    <>
      {/* 返回顶部按钮 - 固定在页面右下角 */}
      <button
        onClick={handleBackToTop}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          padding: "20px",
          background: "#E93B66",
          color: "#fff",
          border: "none",
          borderRadius: "100px",
          cursor: "pointer",
          fontSize: "1rem",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "background 0.2s, opacity 0.3s, transform 0.3s",
          zIndex: 1000,
          pointerEvents: isVisible ? "auto" : "none",
        }}
        className="return-top-btn"
        onMouseOver={(e) => (e.currentTarget.style.background = "#5b5b5b")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#E93B66")}
      >
        <ArrowBigUpDash />
      </button>

      <footer
        style={{
          width: "100%",
          height: "300px",
          minHeight: "300px",
          background: "url('/footer.svg') no-repeat center/contain",
          backgroundPosition: "center bottom",
          color: "#686868",
          display: "flex",
          alignItems: "center",
          letterSpacing: "1px",
          position: "relative",
          padding: "20px",
          gap: "20px",
          overflow: "visible",
        }}
        className="footer-responsive font-bold items-center justify-center"
      >
        {/* 版权声明 */}
        <span style={{ fontSize: "1rem", marginBottom: "8px" }}>
          © {new Date().getFullYear()} AstarCup. All rights reserved.
          <div>
            <a href="https://beian.miit.gov.cn/" target="_blank">
              闽ICP备2026007493号-1
            </a>
            <div className="flex flex-row gap-2">
              <img
                src="https://beian.mps.gov.cn/web/assets/logo01.6189a29f.png"
                width="24px"
                height="24px"
                alt="icon"
              />
              <a
                href="https://beian.mps.gov.cn/#/query/webSearch?code=35063002000143"
                rel="noreferrer"
                target="_blank"
              >
                闽公网安备35063002000143号
              </a>
            </div>
          </div>
          <p>Ciallo～ (∠・ω&lt; )⌒☆</p>
          <p>version_{version}</p>
        </span>
        <span style={{ fontSize: "0.9rem", opacity: 0.8 }}></span>

        {/* 友情链接 */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <a
              href="https://osu.ppy.sh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bold text-gray-400 hover:text-white hover:bg-pink-300 rounded-lg px-2 py-1 transition-all"
            >
              osu! 官网
            </a>
            <a
              href="https://lazer.g0v0.top"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bold text-gray-400 hover:text-white hover:bg-pink-300 rounded-lg px-2 py-1 transition-all"
            >
              osu!lazer 咕哦服
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
