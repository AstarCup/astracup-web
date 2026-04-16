import { NextRequest, NextResponse } from "next/server";
import { getUserPermissions } from "@/lib/permissions";
import {
  getTournamentSettings,
  updateTournamentSettings,
} from "@/lib/prisma-registrations";

export async function GET(_request: NextRequest) {
  try {
    const settingsArray = await getTournamentSettings();

    if (!settingsArray || settingsArray.length === 0) {
      // 返回默认设置
      return NextResponse.json({
        success: true,
        settings: {
          tournament_name: "",
          max_pp_for_registration: 7000,
          min_pp_for_registration: 0,
          current_season: "s1",
          current_season_stage: "registration",
          registration_enabled: true,
          mappool_visible: false,
        },
      });
    }

    // 将数组转换为对象
    const settingsObject: Record<string, any> = {};

    settingsArray.forEach((setting) => {
      const key = setting.setting_key;
      const value = setting.setting_value;

      try {
        // 尝试解析JSON值（用于数组和布尔值）
        const parsedValue = JSON.parse(value);
        settingsObject[key] = parsedValue;
      } catch {
        // 如果解析失败，检查是否是数字字符串
        if (!isNaN(Number(value)) && value.trim() !== "") {
          settingsObject[key] = Number(value);
        } else if (value === "true" || value === "false") {
          settingsObject[key] = value === "true";
        } else {
          // 使用原始字符串值
          settingsObject[key] = value;
        }
      }
    });

    // 确保所有必需的字段都有值
    const defaultSettings = {
      tournament_name: "",
      max_pp_for_registration: 7000,
      min_pp_for_registration: 0,
      current_season: "s1",
      current_season_stage: "registration",
      registration_enabled: true,
      mappool_visible: false,
    };

    const finalSettings = { ...defaultSettings, ...settingsObject };

    return NextResponse.json({
      success: true,
      settings: finalSettings,
    });
  } catch (error) {
    console.error("Error getting tournament settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取比赛设置失败",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const cookieStore = await request.cookies;
    const sessionCookie = cookieStore.get("astra_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: "未登录",
        },
        { status: 401 },
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "会话无效",
        },
        { status: 401 },
      );
    }

    const osuId = session.osuId;
    if (!osuId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID无效",
        },
        { status: 400 },
      );
    }

    // 检查用户权限（只有管理员可以修改设置）
    const permissions = await getUserPermissions(osuId);
    if (!permissions.isadmin) {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足",
        },
        { status: 403 },
      );
    }

    // 获取请求数据
    const settingsData = await request.json();

    // 验证必填字段
    if (!settingsData.tournament_name) {
      return NextResponse.json(
        {
          success: false,
          error: "比赛名称不能为空",
        },
        { status: 400 },
      );
    }

    // 将设置数据转换为键值对格式
    const settingsMap: Record<string, string> = {};

    // 处理所有传入的字段
    Object.entries(settingsData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // 根据字段类型进行转换
        if (typeof value === "boolean") {
          settingsMap[key] = String(value);
        } else if (typeof value === "number") {
          settingsMap[key] = String(value);
        } else if (typeof value === "string") {
          settingsMap[key] = value;
        } else if (Array.isArray(value)) {
          settingsMap[key] = JSON.stringify(value);
        } else if (typeof value === "object") {
          settingsMap[key] = JSON.stringify(value);
        } else {
          settingsMap[key] = String(value);
        }
      }
    });

    // 更新设置
    const success = await updateTournamentSettings(settingsMap);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "更新比赛设置失败",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "比赛设置更新成功",
    });
  } catch (error) {
    console.error("Error updating tournament settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新比赛设置失败",
      },
      { status: 500 },
    );
  }
}
