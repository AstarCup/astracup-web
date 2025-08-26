"use client";

import { useEffect } from "react";
const $ = require("jquery")(window);
import "jquery-bracket";
import "jquery-bracket/dist/jquery.bracket.min.css";

export default function Schedule() {
    useEffect(() => {
        $("#bracket").bracket({
            init: {
                teams: [["Team 1", "Team 2"], ["Team 3", "Team 4"]],
                results: [[[1, 2], [2, 1]]],
            },
        });
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">赛程安排</h1>
            <div id="bracket"></div>
        </div>
    );
}