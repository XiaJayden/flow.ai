import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      platform: process.platform,
      nodeVersion: process.version,
      
      // Database URL analysis
      databaseUrl: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length,
        prefix: process.env.DATABASE_URL?.substring(0, 30),
        suffix: process.env.DATABASE_URL?.substring(process.env.DATABASE_URL?.length - 30),
        startsWithLibsql: process.env.DATABASE_URL?.startsWith('libsql://'),
        hasAuthToken: process.env.DATABASE_URL?.includes('authToken='),
        hasQuestionMark: process.env.DATABASE_URL?.includes('?'),
        authTokenLength: process.env.DATABASE_URL?.split('authToken=')?.[1]?.length,
        // Show just the hostname part for debugging
        hostname: process.env.DATABASE_URL?.match(/libsql:\/\/([^?]+)/)?.[1],
      },
      
      // Other required env vars
      nextAuth: {
        hasUrl: !!process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL,
      },
      
      youtube: {
        hasApiKey: !!process.env.YOUTUBE_API_KEY,
        keyLength: process.env.YOUTUBE_API_KEY?.length,
      },
      
      // Environment variable count
      totalEnvVars: Object.keys(process.env).length,
      
      // Check for common issues
      issues: [] as string[]
    }
    
    // Detect potential issues
    if (!process.env.DATABASE_URL) {
      envInfo.issues.push('DATABASE_URL is missing')
    } else {
      if (!process.env.DATABASE_URL.startsWith('libsql://')) {
        envInfo.issues.push('DATABASE_URL does not start with libsql://')
      }
      if (!process.env.DATABASE_URL.includes('authToken=')) {
        envInfo.issues.push('DATABASE_URL is missing authToken parameter')
      }
      if (process.env.DATABASE_URL.includes(' ')) {
        envInfo.issues.push('DATABASE_URL contains spaces (encoding issue)')
      }
      if (process.env.DATABASE_URL.length < 100) {
        envInfo.issues.push('DATABASE_URL seems too short (missing token?)')
      }
    }

    return NextResponse.json({
      success: true,
      environment: envInfo
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}