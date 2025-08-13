import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  console.log('Creating Prisma client...', {
    nodeEnv: process.env.NODE_ENV,
    dbUrlType: process.env.DATABASE_URL?.startsWith('libsql://') ? 'turso' : 'sqlite',
    vercelEnv: process.env.VERCEL_ENV,
    runtime: typeof window === 'undefined' ? 'server' : 'client'
  })

  // Use Turso in production, local SQLite in development
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    console.log('Attempting Turso connection...')
    
    // Check if we have all required dependencies
    let hasLibSqlClient = false
    let hasPrismaAdapter = false
    
    try {
      require.resolve('@libsql/client')
      hasLibSqlClient = true
    } catch (e) {
      console.warn('@libsql/client not found')
    }
    
    try {
      require.resolve('@prisma/adapter-libsql')
      hasPrismaAdapter = true
    } catch (e) {
      console.warn('@prisma/adapter-libsql not found')
    }
    
    if (!hasLibSqlClient || !hasPrismaAdapter) {
      console.error('Missing Turso dependencies:', { hasLibSqlClient, hasPrismaAdapter })
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing Turso dependencies: libsql=${hasLibSqlClient}, adapter=${hasPrismaAdapter}`)
      }
      return new PrismaClient({ log: ['query'] })
    }
    
    // Dynamic import for server-side only packages
    try {
      console.log('Loading Turso dependencies...')
      const { PrismaLibSQL } = require('@prisma/adapter-libsql')
      const { createClient } = require('@libsql/client')
      
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for Turso connection')
      }

      console.log('Creating libSQL client...')
      const libsql = createClient({
        url: process.env.DATABASE_URL,
      })
      
      console.log('Creating Turso adapter...')
      const adapter = new PrismaLibSQL(libsql)
      
      console.log('Creating Prisma client with Turso adapter...')
      // Type assertion to bypass build-time type checking
      const client = new (PrismaClient as any)({ 
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'info'] : ['error']
      })
      
      console.log('✅ Turso client created successfully')
      return client as PrismaClient
    } catch (error) {
      console.error('❌ Failed to initialize Turso client:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      
      // Log specific error types
      if (error instanceof Error) {
        if (error.message.includes('Cannot find module')) {
          console.error('🔍 Module resolution error - check dependencies')
        }
        if (error.message.includes('adapter')) {
          console.error('🔍 Adapter initialization error')
        }
        if (error.message.includes('libsql')) {
          console.error('🔍 LibSQL client error - check DATABASE_URL')
        }
      }
      
      // In production, create a basic client and let it fail at query time with better error
      if (process.env.NODE_ENV === 'production') {
        console.log('Creating fallback Prisma client for production')
        return new PrismaClient({
          log: ['error']
        })
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

// Lazy initialization to avoid build-time issues
let _db: PrismaClient | undefined

export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_db) {
      _db = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
    }
    return (_db as any)[prop]
  }
})