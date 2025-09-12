'use client';
import React from "react";

export default function Footer() {
    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return (
        <footer
            style={{
                width: "100%",
                height: "300px",
                minHeight: "300px",
                background: "url('/footer.svg') no-repeat center/contain",
                backgroundPosition: "center bottom",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "1px",
                position: "relative",
                // 允许图片溢出footer区域
                overflow: "visible",
            }}
        >
            <span style={{ position: 'relative', zIndex: 1 }}>
                © {new Date().getFullYear()} Astara Cup. All rights reserved.
            </span>
            <button
                onClick={handleBackToTop}
                style={{
                    position: "absolute",
                    right: 40,
                    bottom: 30,
                    padding: "0px 0px 0px 10px",
                    background: "#E93B66",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    opacity: 1,
                    transition: "background 0.2s, opacity 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#3BE9D8')}
                onMouseOut={e => (e.currentTarget.style.background = '#E93B66')}
            >
                <img src="/icons/returnTop.svg" alt="返回顶部" width={80} height={80} />
            </button>
        </footer>
    );
}

