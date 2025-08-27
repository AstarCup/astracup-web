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
        import("jquery-bracket/dist/jquery.bracket.min.js").then(() => {
            if (bracketRef.current) {
                $(bracketRef.current).empty();

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
