import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      dbUrl: process.env.DATABASE_URL?.substring(0, 20) + '...',
      vercelEnv: process.env.VERCEL_ENV
    })

    // Test basic database connection
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('Database query result:', result)

    // Test user table access
    const userCount = await db.user.count()
    console.log('User count:', userCount)

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      result
    })
  } catch (error) {
    console.error('Database test error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}