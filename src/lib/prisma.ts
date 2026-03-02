import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "server-only";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// 在 serverless 环境复用同一实例，避免每次请求重建连接
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 生产环境也缓存，因为 Vercel 会复用同一 Lambda 实例处理多个请求
globalForPrisma.prisma = prisma;
