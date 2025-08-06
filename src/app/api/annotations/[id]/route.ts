import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const annotationId = resolvedParams.id

    // Find the annotation and verify ownership
    const annotation = await db.annotation.findUnique({
      where: { id: annotationId },
      include: {
        song: {
          include: {
            band: {
              include: {
                members: {
                  where: {
                    userId: session.user.id
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Check if user is the annotation owner OR band admin
    const isOwner = annotation.userId === session.user.id
    const isBandMember = annotation.song.band.members.length > 0
    const bandMember = annotation.song.band.members[0]
    const isBandAdmin = bandMember?.role === 'admin'

    if (!isOwner && !isBandAdmin) {
      return NextResponse.json({ 
        error: 'You can only delete your own annotations or you must be a band admin' 
      }, { status: 403 })
    }

    // Delete the annotation (comments will be deleted via cascade)
    await db.annotation.delete({
      where: { id: annotationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}