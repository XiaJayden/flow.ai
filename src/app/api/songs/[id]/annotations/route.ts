import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseInstruments, stringifyInstruments } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const songId = params.id
    const { content, timestamp, instruments } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (typeof timestamp !== 'number' || timestamp < 0) {
      return NextResponse.json({ error: 'Valid timestamp is required' }, { status: 400 })
    }

    if (!Array.isArray(instruments) || instruments.length === 0) {
      return NextResponse.json({ error: 'At least one instrument is required' }, { status: 400 })
    }

    // Verify song exists and user has access
    const song = await db.song.findFirst({
      where: {
        id: songId,
        band: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found or access denied' }, { status: 404 })
    }

    // Create annotation
    const annotation = await db.annotation.create({
      data: {
        songId,
        userId: session.user.id,
        content: content.trim(),
        timestamp,
        instruments: stringifyInstruments(instruments)
      },
      include: {
        user: true,
        comments: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Transform response to include parsed instruments
    const responseAnnotation = {
      ...annotation,
      instruments: parseInstruments(annotation.instruments),
      user: {
        ...annotation.user,
        instruments: parseInstruments(annotation.user.instruments)
      },
      comments: annotation.comments.map(comment => ({
        ...comment,
        user: {
          ...comment.user,
          instruments: parseInstruments(comment.user.instruments)
        }
      }))
    }

    return NextResponse.json(responseAnnotation, { status: 201 })
  } catch (error) {
    console.error('Create annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const songId = params.id

    // Verify song exists and user has access
    const song = await db.song.findFirst({
      where: {
        id: songId,
        band: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found or access denied' }, { status: 404 })
    }

    // Get annotations with comments
    const annotations = await db.annotation.findMany({
      where: { songId },
      include: {
        user: true,
        comments: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Transform response to include parsed instruments
    const responseAnnotations = annotations.map(annotation => ({
      ...annotation,
      instruments: parseInstruments(annotation.instruments),
      user: {
        ...annotation.user,
        instruments: parseInstruments(annotation.user.instruments)
      },
      comments: annotation.comments.map(comment => ({
        ...comment,
        user: {
          ...comment.user,
          instruments: parseInstruments(comment.user.instruments)
        }
      }))
    }))

    return NextResponse.json(responseAnnotations)
  } catch (error) {
    console.error('Get annotations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}