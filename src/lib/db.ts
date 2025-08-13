import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  console.log('Creating Prisma client...', {
    nodeEnv: process.env.NODE_ENV,
    dbUrlType: process.env.DATABASE_URL?.startsWith('libsql://') ? 'turso' : 'sqlite',
    vercelEnv: process.env.VERCEL_ENV
  })

  // Use Turso in production, local SQLite in development
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    // Dynamic import for server-side only packages
    try {
      console.log('Initializing Turso client...')
      const { PrismaLibSQL } = require('@prisma/adapter-libsql')
      const { createClient } = require('@libsql/client')
      
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for Turso connection')
      }

      const libsql = createClient({
        url: process.env.DATABASE_URL,
      })
      
      console.log('Creating Turso adapter...')
      const adapter = new PrismaLibSQL(libsql)
      
      // Type assertion to bypass build-time type checking
      const client = new (PrismaClient as any)({ 
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query'] : ['error']
      })
      
      console.log('Turso client created successfully')
      return client as PrismaClient
    } catch (error) {
      console.error('Failed to initialize Turso client:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      
      // In production, don't fall back to SQLite - this will cause issues
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to initialize Turso database client in production')
      }
      
      console.log('Falling back to local SQLite in development')
      return new PrismaClient({ log: ['query'] })
    }
  }
  
  // Local SQLite for development
  console.log('Using local SQLite client')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db