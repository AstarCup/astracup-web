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
                height: "120px",
                background: "#000",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "1px",
                position: "relative",
            }}
        >
            <span>
                © {new Date().getFullYear()} Astara Cup. All rights reserved.
            </span>
            <button
                onClick={handleBackToTop}
                style={{
                    position: "absolute",
                    right: 40,
                    bottom: 30,
                    padding: "10px 18px",
                    background: "#E93B66",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    opacity: 0.85,
                    transition: "background 0.2s, opacity 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#3BE9D8')}
                onMouseOut={e => (e.currentTarget.style.background = '#E93B66')}
            >
                返回顶部
            </button>
        </footer>
    );
}

