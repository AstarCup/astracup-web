// 评论系统数据库管理 - 已迁移至Prisma
import { prisma } from "./prisma";

// 评论数据类型定义
export interface MapComment {
  id: number;
  mapSelectionId: number; // 关联的选图ID
  userId: string; // 评论用户的osu ID
  username: string; // 评论用户的用户名
  avatar_url: string; // 用户头像URL
  comment: string; // 评论内容
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 将数据库记录转换为 MapComment 接口
function rowToMapComment(row: any): MapComment {
  return {
    id: row.id,
    mapSelectionId: row.mapSelectionId,
    userId: row.userId,
    username: row.username,
    avatar_url: row.avatar_url || "",
    comment: row.comment || "",
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

// 评论数据库操作
export const mapCommentsStorage = {
  // 获取指定选图的所有评论
  async getCommentsForMap(mapSelectionId: number): Promise<MapComment[]> {
    try {
      const rows = await prisma.mapComment.findMany({
        where: { mapSelectionId },
        orderBy: { createdAt: "desc" },
      });

      return rows.map(rowToMapComment);
    } catch (error) {
      console.error("Error getting map comments:", error);
      return [];
    }
  },

  // 添加评论
  async addComment(
    mapSelectionId: number,
    userId: string,
    username: string,
    comment: string,
    avatar_url: string = "",
  ): Promise<boolean> {
    try {
      if (!comment || !comment.trim()) {
        console.log("Empty comment, skipping");
        return false;
      }

      await prisma.mapComment.create({
        data: {
          mapSelectionId,
          userId,
          username,
          comment: comment.trim(),
          avatar_url: avatar_url || "",
        },
      });

      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      return false;
    }
  },

  // 删除评论
  async deleteComment(id: number): Promise<boolean> {
    try {
      const result = await prisma.mapComment.deleteMany({
        where: { id },
      });
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  },

  // 按ID删除评论（带用户权限验证）
  async deleteCommentById(id: number, userId?: string): Promise<boolean> {
    try {
      const where: any = { id };
      if (userId) {
        where.userId = userId;
      }

      const result = await prisma.mapComment.deleteMany({ where });
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting comment by id:", error);
      return false;
    }
  },

  // 按选图ID和用户ID删除评论
  async deleteCommentByMapAndUser(
    mapSelectionId: number,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await prisma.mapComment.deleteMany({
        where: {
          mapSelectionId,
          userId,
        },
      });
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting comment by map and user:", error);
      return false;
    }
  },

  // 批量获取评论数据（按mapSelectionId分组）
  async getBatchComments(
    mapSelectionIds: number[],
  ): Promise<{ [key: number]: MapComment[] }> {
    if (mapSelectionIds.length === 0) {
      return {};
    }

    try {
      const rows = await prisma.mapComment.findMany({
        where: { mapSelectionId: { in: mapSelectionIds } },
        orderBy: { createdAt: "desc" },
      });

      // 初始化结果
      const result: { [key: number]: MapComment[] } = {};
      mapSelectionIds.forEach((id) => {
        result[id] = [];
      });

      // 按mapSelectionId分组
      rows.forEach((row) => {
        const mapSelectionId = row.mapSelectionId;
        if (result[mapSelectionId]) {
          result[mapSelectionId].push(rowToMapComment(row));
        }
      });

      return result;
    } catch (error) {
      console.error("Error getting batch comments:", error);
      const result: { [key: number]: MapComment[] } = {};
      mapSelectionIds.forEach((id) => {
        result[id] = [];
      });
      return result;
    }
  },

  // 获取用户的所有评论
  async getUserComments(userId: string): Promise<MapComment[]> {
    try {
      const rows = await prisma.mapComment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return rows.map(rowToMapComment);
    } catch (error) {
      console.error("Error getting user comments:", error);
      return [];
    }
  },
};

// 保留旧函数名以兼容现有代码（已废弃的评分功能）
export const initMapRatingsDatabase = async (): Promise<void> => {
  // 不再需要手动初始化数据库，Prisma会自动处理
  console.log("Map comments database is managed by Prisma");
};

// 导出评论相关函数
export const getCommentsForMap = mapCommentsStorage.getCommentsForMap;
export const addComment = mapCommentsStorage.addComment;
export const deleteComment = mapCommentsStorage.deleteComment;
export const deleteCommentById = mapCommentsStorage.deleteCommentById;
export const getBatchComments = mapCommentsStorage.getBatchComments;
export const getUserComments = mapCommentsStorage.getUserComments;

// 保持原有函数名兼容性（但不再有评分功能）
export const getRatingsForMap = mapCommentsStorage.getCommentsForMap;
export const getUserRating = async () => null;
export const addRating = mapCommentsStorage.addComment;
export const deleteRating = mapCommentsStorage.deleteComment;
export const deleteRatingById = mapCommentsStorage.deleteCommentById;
export const getRatingStats = async () => ({
  averageRating: 0,
  totalRatings: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
});
export const getBatchRatingStats = async () => ({});

export default initMapRatingsDatabase;