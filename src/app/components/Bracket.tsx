"use client";

import { useEffect, useRef } from "react";
import $ from "jquery";
import "./jquery-bracket.css";

declare global {
    interface Window {
        $: typeof $;
        jQuery: typeof $;
    }
}

// 确保jQuery在全局可用
if (typeof window !== "undefined") {
    window.$ = $;
    window.jQuery = $;
}

interface BracketProps {
    teams: Array<string[]>;
    results: any[];
    teamWidth?: number;
    scoreWidth?: number;
    matchMargin?: number;
    roundMargin?: number;
    className?: string;
}

export default function Bracket({
    teams,
    results,
    teamWidth = 100,
    scoreWidth = 20,
    matchMargin = 80,
    roundMargin = 50,
    className = ""
}: BracketProps) {
    const bracketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 动态导入jquery-bracket，确保jQuery已经全局可用
        import("jquery-bracket/dist/jquery.bracket.min.js").then(() => {
            if (bracketRef.current) {
                // 清除之前的bracket内容
                $(bracketRef.current).empty();

                // 初始化bracket
                $(bracketRef.current).bracket({
                    init: {
                        teams: teams,
                        results: results
                    },
                    teamWidth: teamWidth,
                    scoreWidth: scoreWidth,
                    matchMargin: matchMargin,
                    roundMargin: roundMargin
                });
            }
        });

        // 清理函数
        return () => {
            if (bracketRef.current) {
                $(bracketRef.current).empty();
            }
        };
    }, [teams, results, teamWidth, scoreWidth, matchMargin, roundMargin]);

    return (
        <div className={`overflow-x-auto ${className}`}>
            <div ref={bracketRef} id="bracket"></div>
        </div>
    );
}
