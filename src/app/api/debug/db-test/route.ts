import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30),
      dbUrlSuffix: process.env.DATABASE_URL?.substring(process.env.DATABASE_URL.length - 30),
      dbUrlLength: process.env.DATABASE_URL?.length,
      isTurso: process.env.DATABASE_URL?.startsWith('libsql://'),
      hasAuthToken: process.env.DATABASE_URL?.includes('authToken='),
      runtime: typeof globalThis !== 'undefined' ? 'node' : 'browser',
    },
    tests: [] as any[]
  }

  try {
    console.log('🔍 Starting database connection tests...')
    
    // Test 1: Basic connection
    testResults.tests.push({ name: 'Basic Connection', status: 'running' })
    const basicResult = await db.$queryRaw`SELECT 1 as test, datetime('now') as timestamp`
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Basic Connection',
      status: 'success',
      result: basicResult
    }

    // Test 2: Check database schema
    testResults.tests.push({ name: 'Schema Check', status: 'running' })
    const tables = await db.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Schema Check',
      status: 'success',
      result: { tables }
    }

    // Test 3: User table access
    testResults.tests.push({ name: 'User Table Access', status: 'running' })
    const userCount = await db.user.count()
    testResults.tests[testResults.tests.length - 1] = {
      name: 'User Table Access',
      status: 'success',
      result: { userCount }
    }

    // Test 4: Prisma operations
    testResults.tests.push({ name: 'Prisma Operations', status: 'running' })
    const sampleUser = await db.user.findFirst()
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Prisma Operations',
      status: 'success',
      result: { 
        hasSampleUser: !!sampleUser,
        userId: sampleUser?.id?.substring(0, 8) + '...' || 'none'
      }
    }

    // Convert BigInt values to strings for JSON serialization
    const sanitizedResults = JSON.parse(JSON.stringify(testResults, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ))

    return NextResponse.json({
      success: true,
      message: 'All database tests passed!',
      ...sanitizedResults
    })

  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    // Update the last running test to failed
    const lastTestIndex = testResults.tests.findIndex(t => t.status === 'running')
    if (lastTestIndex >= 0) {
      testResults.tests[lastTestIndex] = {
        ...testResults.tests[lastTestIndex],
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    }

    // Provide helpful error analysis
    let errorAnalysis = 'Unknown database error'
    if (error instanceof Error) {
      if (error.message.includes('Error code 14') || error.message.includes('Unable to open the database file')) {
        errorAnalysis = 'Turso auth token invalid/expired or database does not exist - generate new token with: turso db tokens create flowai'
      } else if (error.message.includes('SQLITE_AUTH') || error.message.includes('unauthorized')) {
        errorAnalysis = 'Authentication failed - check your Turso auth token'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorAnalysis = 'Network connectivity issue - check Turso URL and internet connection'
      } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
        errorAnalysis = 'Database or table not found - check database name and schema'
      } else if (error.message.includes('timeout')) {
        errorAnalysis = 'Connection timeout - Turso database may be slow or unreachable'
      }
    }

    return NextResponse.json({
      success: false,
      error: errorDetails.message,
      errorAnalysis,
      ...testResults,
      errorDetails
    }, { status: 500 })
  }
}