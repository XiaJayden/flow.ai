import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Use Turso in production, local SQLite in development
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    // Dynamic import for server-side only packages
    try {
      const { PrismaLibSQL } = require('@prisma/adapter-libsql')
      const { createClient } = require('@libsql/client')
      
      const libsql = createClient({
        url: process.env.DATABASE_URL,
      })
      const adapter = new PrismaLibSQL(libsql)
      
      // Type assertion to bypass build-time type checking
      const client = new (PrismaClient as any)({ 
        adapter,
        log: ['query'] 
      })
      
      return client as PrismaClient
    } catch (error) {
      console.error('Failed to initialize Turso client, falling back to local SQLite:', error)
      return new PrismaClient({ log: ['query'] })
    }
  }
  
  // Local SQLite for development
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db