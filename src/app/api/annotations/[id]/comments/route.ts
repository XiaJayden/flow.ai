import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseInstruments } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const annotationId = params.id
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify annotation exists and user has access to the song
    const annotation = await db.annotation.findFirst({
      where: {
        id: annotationId,
        song: {
          band: {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found or access denied' }, { status: 404 })
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        annotationId,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: true
      }
    })

    // Transform response to include parsed instruments
    const responseComment = {
      ...comment,
      user: {
        ...comment.user,
        instruments: parseInstruments(comment.user.instruments)
      }
    }

    return NextResponse.json(responseComment, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}