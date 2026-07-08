// Prisma Client单例模式
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7配置
function createPrismaClient() {
  // 在build时返回一个空的客户端占位符
  if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Prisma Client is not available during build time')
      }
    })
  }

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db'
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
