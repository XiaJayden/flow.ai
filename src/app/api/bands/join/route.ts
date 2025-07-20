import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { joinCode } = await request.json()

    if (!joinCode?.trim()) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 })
    }

    // Find band by join code
    const band = await db.band.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!band) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })
    }

    // Check if user is already a member
    if (band.members.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this band' }, { status: 400 })
    }

    // Add user as member
    await db.bandMember.create({
      data: {
        userId: session.user.id,
        bandId: band.id,
        role: 'member'
      }
    })

    // Return band with updated member count
    const updatedBand = await db.band.findUnique({
      where: { id: band.id },
      include: {
        _count: {
          select: {
            members: true,
            songs: true
          }
        }
      }
    })

    return NextResponse.json(updatedBand, { status: 200 })
  } catch (error) {
    console.error('Join band error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}