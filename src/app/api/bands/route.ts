import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateJoinCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Band name is required' }, { status: 400 })
    }

    // Generate unique join code
    let joinCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      joinCode = generateJoinCode()
      const existing = await db.band.findUnique({ where: { joinCode } })
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique join code' }, { status: 500 })
    }

    // Create band and add creator as admin
    const band = await db.band.create({
      data: {
        name: name.trim(),
        joinCode,
        members: {
          create: {
            userId: session.user.id,
            role: 'admin'
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            songs: true
          }
        }
      }
    })

    return NextResponse.json(band, { status: 201 })
  } catch (error) {
    console.error('Create band error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bands = await db.bandMember.findMany({
      where: { userId: session.user.id },
      include: {
        band: {
          include: {
            _count: {
              select: {
                members: true,
                songs: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return NextResponse.json(bands.map(membership => ({
      ...membership.band,
      role: membership.role,
      joinedAt: membership.joinedAt
    })))
  } catch (error) {
    console.error('Get bands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}