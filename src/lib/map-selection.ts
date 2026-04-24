// 选图系统数据库管理 - 使用 Prisma
import {prisma} from "@/lib/prisma";
import { verifyMapSelectionAuth, verifyAdminAuth } from "./permissions";

// 选图数据类型定义
export interface MapSelection {
  id: number;
  beatmapId: number; // beatmap ID
  beatmapsetId: number; // beatmapset ID
  title: string; // 歌曲标题
  title_unicode: string; // 歌曲标题（Unicode/原曲名）
  artist: string; // 艺术家
  artist_unicode: string; // 艺术家（Unicode/原曲名）
  version: string; // 难度名称
  creator: string; // 作图者
  starRating: number; // 星级
  bpm: number; // BPM
  totalLength: number; // 总长度（秒）
  maxCombo: number; // 最大连击数
  ar: number; // Approach Rate
  cs: number; // Circle Size
  od: number; // Overall Difficulty
  hp: number; // Health Points (HP Drain Rate)
  selectedMods: string; // 选择的mod，如 "NM", "HD", "HR" 等
  modPosition: number; // mod位数，如 nm1的1, hd2的2
  customDTRate?: number; // 自定义DT倍率（可选）- 从selectedMods中解析
  customModName?: string; // 自定义mod名称（用于LZ mod）- 从selectedMods中解析
  comment: string; // 注释信息
  selectedBy: string; // 选图者的osu ID
  selectedByUsername: string; // 选图者的用户名 - 从User表关联获取
  selectedByAvatar: string; // 选图者的头像URL - 从User表关联获取
  selectedAt: string; // 选图时间
  season: string; // 赛季标识，如 "s1", "s2"
  category: string; // 类别，如 "qualification", "ro32", "ro16" 等
  url: string; // beatmap URL
  coverUrl: string; // 封面URL
  approved: boolean; // 是否过审
  padding?: boolean; // 是否为padding状态
}

// 从 selectedMods 字符串中解析出自定义字段
function parseCustomMods(selectedMods: string | null | undefined): {
  baseMod: string;
  customDTRate?: number;
  customModName?: string;
} {
  if (!selectedMods) return { baseMod: "NM" };

  try {
    // 尝试解析为 JSON 格式（包含自定义字段时使用）
    const parsed = JSON.parse(selectedMods);
    if (typeof parsed === "object" && parsed.mod) {
      return {
        baseMod: parsed.mod,
        customDTRate: parsed.customDTRate ?? undefined,
        customModName: parsed.customModName ?? undefined,
      };
    }
  } catch {
    // 不是 JSON 格式，作为普通 mod 字符串处理
  }

  return { baseMod: selectedMods };
}

// 将 mod 信息和自定义字段编码为 selectedMods 字符串
function encodeSelectedMods(
  baseMod: string,
  customDTRate?: number | null,
  customModName?: string | null,
): string {
  // 如果有自定义字段，使用 JSON 编码
  if (customDTRate != null || customModName != null) {
    return JSON.stringify({
      mod: baseMod,
      ...(customDTRate != null ? { customDTRate } : {}),
      ...(customModName != null ? { customModName } : {}),
    });
  }
  return baseMod;
}

// 将数据库记录转换为 MapSelection 接口
function rowToMapSelection(
  row: any,
  user?: { username: string; avatar_url: string | null } | null,
): MapSelection {
  const { baseMod, customDTRate, customModName } = parseCustomMods(
    row.selectedMods,
  );
  return {
    id: row.id,
    beatmapId: row.beatmapId,
    beatmapsetId: row.beatmapsetId,
    title: row.title,
    title_unicode: row.title_unicode || row.title,
    artist: row.artist,
    artist_unicode: row.artist_unicode || row.artist,
    version: row.version,
    creator: row.creator,
    starRating: row.starRating,
    bpm: row.bpm,
    totalLength: row.totalLength,
    maxCombo: row.maxCombo || 0,
    ar: row.ar || 0,
    cs: row.cs || 0,
    od: row.od || 0,
    hp: row.hp || 0,
    selectedMods: baseMod,
    modPosition: row.modPosition || 1,
    customDTRate,
    customModName,
    comment: row.comment || "",
    selectedBy: row.selectedBy,
    selectedByUsername: user?.username || `User_${row.selectedBy}`,
    selectedByAvatar: user?.avatar_url || "",
    selectedAt: row.selectedAt,
    season: row.season || "",
    category: row.category || "",
    url: row.url || "",
    coverUrl: row.coverUrl || "",
    approved: row.approved,
    padding: row.padding || false,
  };
}

// 选图数据库操作
export const mapSelectionStorage = {
  // 获取所有选图
  async getMapSelections(
    season: string = "s1",
    category?: string,
    padding?: boolean,
  ): Promise<MapSelection[]> {
    try {
      const where: any = {
        season: season,
      };

      if (category && category !== "all") {
        where.category = category;
      }

      if (padding !== undefined) {
        where.padding = padding;
      }

      const rows = await prisma.mapSelection.findMany({
        where,
        orderBy: { selectedAt: "desc" },
      });

      // 批量获取用户信息
      const osuIds = [...new Set(rows.map((r) => r.selectedBy))];
      const users = await prisma.user.findMany({
        where: { osuId: { in: osuIds } },
        select: { osuId: true, username: true, avatar_url: true },
      });
      const userMap = new Map(users.map((u) => [u.osuId, u]));

      return rows.map((row) =>
        rowToMapSelection(row, userMap.get(row.selectedBy)),
      );
    } catch (error) {
      console.error("Error getting map selections:", error);
      return [];
    }
  },

  // 添加选图
  async addMapSelection(
    selection: Omit<MapSelection, "id" | "selectedAt"> & {
      selectedByUsername?: string;
      selectedByAvatar?: string;
    },
  ): Promise<boolean> {
    try {
      const encodedMods = encodeSelectedMods(
        selection.selectedMods,
        selection.customDTRate,
        selection.customModName,
      );

      const data: any = {
        beatmapId: selection.beatmapId,
        beatmapsetId: selection.beatmapsetId,
        title: selection.title,
        title_unicode: selection.title_unicode || selection.title,
        artist: selection.artist,
        artist_unicode: selection.artist_unicode || selection.artist,
        version: selection.version,
        creator: selection.creator,
        starRating: selection.starRating,
        bpm: selection.bpm,
        totalLength: selection.totalLength,
        maxCombo: selection.maxCombo || 0,
        ar: selection.ar,
        cs: selection.cs,
        od: selection.od,
        hp: selection.hp,
        selectedMods: encodedMods,
        modPosition: selection.modPosition,
        comment: selection.comment || "",
        selectedBy: selection.selectedBy,
        season: selection.season,
        category: selection.category,
        url: selection.url,
        coverUrl: selection.coverUrl || "",
        approved: selection.approved,
        padding: selection.padding !== undefined ? selection.padding : false,
      };

      console.log("Inserting map selection with data:", data);

      await prisma.mapSelection.create({ data });
      return true;
    } catch (error) {
      console.error("Error adding map selection:", error);
      return false;
    }
  },

  // 删除选图
  async deleteMapSelection(id: number, selectedBy?: string): Promise<boolean> {
    try {
      const where: any = { id };

      if (selectedBy) {
        where.selectedBy = selectedBy;
      }

      const result = await prisma.mapSelection.deleteMany({ where });
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting map selection:", error);
      return false;
    }
  },

  // 检查beatmap是否已被选择
  async isBeatmapSelected(
    beatmapId: number,
    season: string,
    category: string,
  ): Promise<boolean> {
    try {
      const count = await prisma.mapSelection.count({
        where: { beatmapId, season, category },
      });
      return count > 0;
    } catch (error) {
      console.error("Error checking beatmap selection:", error);
      return false;
    }
  },

  // 更新选图信息
  async updateMapSelection(
    id: number,
    updates: Partial<
      Pick<
        MapSelection,
        | "selectedMods"
        | "comment"
        | "approved"
        | "padding"
        | "customModName"
        | "customDTRate"
        | "title"
        | "title_unicode"
        | "artist"
        | "artist_unicode"
        | "version"
        | "category"
        | "totalLength"
        | "maxCombo"
        | "starRating"
        | "bpm"
        | "ar"
        | "cs"
        | "od"
        | "hp"
      >
    >,
    selectedBy: string,
  ): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.selectedMods !== undefined) {
        // 如果同时提供了 customDTRate/customModName，一起编码
        updateData.selectedMods = encodeSelectedMods(
          updates.selectedMods,
          updates.customDTRate,
          updates.customModName,
        );
      } else if (
        updates.customDTRate !== undefined ||
        updates.customModName !== undefined
      ) {
        // 只更新自定义字段时，需要先获取当前的 selectedMods
        const current = await prisma.mapSelection.findUnique({
          where: { id },
          select: { selectedMods: true },
        });
        const { baseMod } = parseCustomMods(current?.selectedMods);
        updateData.selectedMods = encodeSelectedMods(
          baseMod,
          updates.customDTRate,
          updates.customModName,
        );
      }

      if (updates.comment !== undefined) updateData.comment = updates.comment;
      if (updates.approved !== undefined) updateData.approved = updates.approved;
      if (updates.padding !== undefined) updateData.padding = updates.padding;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.title_unicode !== undefined)
        updateData.title_unicode = updates.title_unicode;
      if (updates.artist !== undefined) updateData.artist = updates.artist;
      if (updates.artist_unicode !== undefined)
        updateData.artist_unicode = updates.artist_unicode;
      if (updates.version !== undefined) updateData.version = updates.version;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.totalLength !== undefined)
        updateData.totalLength = updates.totalLength;
      if (updates.maxCombo !== undefined) updateData.maxCombo = updates.maxCombo;
      if (updates.ar !== undefined) updateData.ar = updates.ar;
      if (updates.cs !== undefined) updateData.cs = updates.cs;
      if (updates.od !== undefined) updateData.od = updates.od;
      if (updates.hp !== undefined) updateData.hp = updates.hp;
      if (updates.starRating !== undefined)
        updateData.starRating = updates.starRating;
      if (updates.bpm !== undefined) updateData.bpm = updates.bpm;

      if (Object.keys(updateData).length === 0) {
        return false;
      }

      // 检查当前用户是否为管理员或选图员
      const isAdmin = await verifyAdminAuth(selectedBy);
      const isMapSelector = await verifyMapSelectionAuth(selectedBy);

      // 权限逻辑：
      // 1. 管理员可以更新任何字段
      // 2. 选图员可以更新任何字段（包括非自己创建的选图）
      // 3. 其他用户只能更新自己创建的选图
      const where: any = { id };

      if (!isAdmin && !isMapSelector) {
        where.selectedBy = selectedBy;
      }

      const result = await prisma.mapSelection.updateMany({
        where,
        data: updateData,
      });

      console.log("Database update result:", {
        id,
        data: updateData,
        selectedBy,
        affectedRows: result.count,
        isAdmin,
        isMapSelector,
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error updating map selection:", error);
      return false;
    }
  },
};

// 导出函数
export const getMapSelections = mapSelectionStorage.getMapSelections;
export const addMapSelection = mapSelectionStorage.addMapSelection;
export const deleteMapSelection = mapSelectionStorage.deleteMapSelection;
export const updateMapSelection = mapSelectionStorage.updateMapSelection;

// 兼容旧的导入方式
export const getPool = () => {
  throw new Error(
    "数据库已迁移至Prisma，请勿使用mysql2连接池。请使用 prisma 直接操作数据库。",
  );
};

export default mapSelectionStorage;