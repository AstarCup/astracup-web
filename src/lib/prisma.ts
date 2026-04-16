import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// 解析数据库URL获取连接参数
const url = new URL(databaseUrl);
const host = url.hostname;
const port = parseInt(url.port) || 3306;
const user = url.username;
const password = url.password;
const database = url.pathname.replace("/", "");

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const adapter = new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
    });

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
