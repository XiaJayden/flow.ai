import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, username, name, password, instruments } = await request.json()

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        username,
        name: name || null,
        password: hashedPassword,
        instruments: JSON.stringify(instruments || [])
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 10),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        vercelEnv: process.env.VERCEL_ENV
      }
    })
    
    // Return more specific error in development
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error',
        ...(isDev && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    )
  }
}