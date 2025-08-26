"use client";

import { useEffect } from "react";
import $ from "jquery";
import "./jquery-bracket.css";
import bracketParams from "./bracket.json";

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

var resizeParameters = {
    teamWidth: 100,
    scoreWidth: 20,
    matchMargin: 80,
    roundMargin: 50,
};
export default function Schedule() {
    useEffect(() => {
        // 动态导入jquery-bracket，确保jQuery已经全局可用
        import("jquery-bracket/dist/jquery.bracket.min.js").then(() => {
            // 初始化bracket
            $("#bracket").bracket({
                init: {
                    teams: bracketParams.teams,
                    results: bracketParams.results
                },
                teamWidth: resizeParameters.teamWidth,
                scoreWidth: resizeParameters.scoreWidth,
                matchMargin: resizeParameters.matchMargin,
                roundMargin: resizeParameters.roundMargin
            });

        });
    },);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">赛程安排</h1>
            <div className="overflow-x-auto">
                <div id="bracket"></div>

            </div>
        </div>
    );
}
