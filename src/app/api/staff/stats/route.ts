import { NextResponse } from "next/server";
import {
    getUsers,
    getAllMatchSchedules,
    getMatchRooms,
} from "@/lib/prisma-registrations";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserPermissions } from "@/lib/permissions";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("astra_session");

        if (!sessionCookie?.value) {
            return NextResponse.json(
                { success: false, error: "未登录" },
                { status: 401 },
            );
        }

        let session;
        try {
            session = JSON.parse(sessionCookie.value);
        } catch {
            return NextResponse.json(
                { success: false, error: "会话无效" },
                { status: 401 },
            );
        }

        if (!session.osuId) {
            return NextResponse.json(
                { success: false, error: "用户ID无效" },
                { status: 400 },
            );
        }

        const permissions = await getUserPermissions(session.osuId);
        if (!permissions.isadmin) {
            return NextResponse.json(
                { success: false, error: "权限不足" },
                { status: 403 },
            );
        }

        const [users, schedules, rooms, approvedMaps, testingMaps, pendingMaps, tournamentSettings] =
            await Promise.all([
                getUsers().catch(() => []),
                getAllMatchSchedules().catch(() => []),
                getMatchRooms().catch(() => []),
                prisma.mapSelection.findMany({
                    where: { approved: true },
                    select: {
                        season: true,
                        category: true,
                        starRating: true,
                        totalLength: true,
                    },
                }),
                prisma.mapSelection.findMany({
                    where: { approved: false, padding: true },
                    select: {
                        season: true,
                        category: true,
                        starRating: true,
                        totalLength: true,
                    },
                }),
                prisma.mapSelection.findMany({
                    where: { approved: false, padding: false },
                    select: {
                        season: true,
                        category: true,
                        starRating: true,
                        totalLength: true,
                    },
                }),
                prisma.tournamentSetting.findMany(),
            ]);

        const approvedPlayers = users.filter(
            (u: any) => u.registrationStatus === "approved",
        );
        const replayCount = schedules.filter((s: any) => s.replay_link).length;
        const adminCount = users.filter(
            (u: any) => u.userGroup === "admin",
        ).length;

        const settingsMap: Record<string, string> = {};
        for (const s of tournamentSettings) {
            settingsMap[s.setting_key] = s.setting_value;
        }

        const tournamentSettingsDisplay = {
            currentSeason: settingsMap["current_season"] || "s1",
            currentSeasonStage: settingsMap["current_season_stage"] || "registration",
            minPp: settingsMap["min_pp_for_registration"] || "0",
            maxPp: settingsMap["max_pp_for_registration"] || "7000",
            registrationEnabled:
                settingsMap["registration_enabled"] !== "false",
            mappoolVisible: settingsMap["mappool_visible"] === "true",
            adminCount,
        };

        const seasons = [...new Set(approvedMaps.map((m) => m.season))].sort();
        const categories = [
            "qualification",
            "ro16",
            "quarterfinals",
            "semifinals",
            "finals",
            "grandfinals",
        ];

        const categoryLabels: Record<string, string> = {
            qualification: "QUA",
            ro16: "RO16",
            quarterfinals: "QF",
            semifinals: "SF",
            finals: "F",
            grandfinals: "GF",
        };

        const seasonMappoolStats: Record<
            string,
            Array<{
                category: string;
                label: string;
                avgStarRating: number;
                avgStarRatingTesting: number;
                avgStarRatingPending: number;
                avgLength: number;
                avgLengthTesting: number;
                avgLengthPending: number;
                count: number;
                testingCount: number;
                pendingCount: number;
            }>
        > = {};

        for (const season of seasons) {
            const seasonApproved = approvedMaps.filter((m) => m.season === season);
            const seasonTesting = testingMaps.filter((m) => m.season === season);
            const seasonPending = pendingMaps.filter((m) => m.season === season);
            const stats: Array<{
                category: string;
                label: string;
                avgStarRating: number;
                avgStarRatingTesting: number;
                avgStarRatingPending: number;
                avgLength: number;
                avgLengthTesting: number;
                avgLengthPending: number;
                count: number;
                testingCount: number;
                pendingCount: number;
            }> = [];

            for (const cat of categories) {
                const catApproved = seasonApproved.filter((m) => m.category === cat);
                const catTesting = seasonTesting.filter((m) => m.category === cat);
                const catPending = seasonPending.filter((m) => m.category === cat);
                if (catApproved.length === 0 && catTesting.length === 0 && catPending.length === 0) continue;
                const avgSR =
                    catApproved.length > 0
                        ? catApproved.reduce((sum, m) => sum + (m.starRating || 0), 0) / catApproved.length
                        : 0;
                const avgSRTesting =
                    catTesting.length > 0
                        ? catTesting.reduce((sum, m) => sum + (m.starRating || 0), 0) / catTesting.length
                        : 0;
                const avgSRPending =
                    catPending.length > 0
                        ? catPending.reduce((sum, m) => sum + (m.starRating || 0), 0) / catPending.length
                        : 0;
                const avgLen =
                    catApproved.length > 0
                        ? Math.round(catApproved.reduce((sum, m) => sum + (m.totalLength || 0), 0) / catApproved.length)
                        : 0;
                const avgLenTesting =
                    catTesting.length > 0
                        ? Math.round(catTesting.reduce((sum, m) => sum + (m.totalLength || 0), 0) / catTesting.length)
                        : 0;
                const avgLenPending =
                    catPending.length > 0
                        ? Math.round(catPending.reduce((sum, m) => sum + (m.totalLength || 0), 0) / catPending.length)
                        : 0;
                stats.push({
                    category: cat,
                    label: categoryLabels[cat] || cat,
                    avgStarRating: Math.round(avgSR * 100) / 100 || 0,
                    avgStarRatingTesting: Math.round(avgSRTesting * 100) / 100 || 0,
                    avgStarRatingPending: Math.round(avgSRPending * 100) / 100 || 0,
                    avgLength: avgLen || 0,
                    avgLengthTesting: avgLenTesting || 0,
                    avgLengthPending: avgLenPending || 0,
                    count: catApproved.length,
                    testingCount: catTesting.length,
                    pendingCount: catPending.length,
                });
            }

            if (stats.length > 0) {
                seasonMappoolStats[season] = stats;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                approvedPlayers: approvedPlayers.length,
                matchRooms: rooms.length,
                mappoolSeasons: seasons.length,
                replayCount,
                totalRegistrations: users.length,
                totalSchedules: schedules.length,
                seasonMappoolStats,
                tournamentSettings: tournamentSettingsDisplay,
            },
        });
    } catch (error) {
        console.error("Error fetching staff stats:", error);
        return NextResponse.json(
            { success: false, error: "获取统计数据失败" },
            { status: 500 },
        );
    }
}
