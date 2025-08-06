import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Use Turso in production, local SQLite in development
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    const libsql = createClient({
      url: process.env.DATABASE_URL,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ 
      adapter,
      log: ['query'] 
    })
  }
  
  // Local SQLite for development
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db