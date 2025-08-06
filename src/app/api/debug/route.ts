import { NextResponse } from 'next/server'

  export async function GET() {
    try {
      // Test environment variables
      const envCheck = {
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuth: !!process.env.NEXTAUTH_SECRET,
        hasYoutube: !!process.env.YOUTUBE_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        databaseUrlStart: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }

      // Test database connection
      const { db } = await import('@/lib/db')

      return NextResponse.json({
        status: 'ok',
        env: envCheck,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Debug endpoint error:', error)
      return NextResponse.json({
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
      }, { status: 500 })
    }
  }
