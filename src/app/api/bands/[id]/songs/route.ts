import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getYouTubeVideoDetails, extractYouTubeId } from '@/lib/youtube'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bandId = params.id

    // Check if user is a member of this band
    const membership = await db.bandMember.findUnique({
      where: {
        userId_bandId: {
          userId: session.user.id,
          bandId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this band' }, { status: 403 })
    }

    const body = await request.json()
    const { youtubeUrl, youtubeId } = body

    let videoId: string | null = null

    if (youtubeId) {
      videoId = youtubeId
    } else if (youtubeUrl) {
      videoId = extractYouTubeId(youtubeUrl)
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'YouTube URL or ID is required' }, { status: 400 })
    }

    // Check if song already exists in this band
    const existingSong = await db.song.findUnique({
      where: {
        bandId_youtubeId: {
          bandId,
          youtubeId: videoId
        }
      }
    })

    if (existingSong) {
      return NextResponse.json({ error: 'This song is already in the band' }, { status: 400 })
    }

    // Get video details from YouTube
    const videoDetails = await getYouTubeVideoDetails(videoId)

    // Add song to band
    const song = await db.song.create({
      data: {
        bandId,
        title: videoDetails.title,
        artist: videoDetails.channelTitle,
        youtubeId: videoId,
        duration: videoDetails.duration,
        thumbnail: videoDetails.thumbnail
      }
    })

    return NextResponse.json(song, { status: 201 })
  } catch (error) {
    console.error('Add song error:', error)
    if (error instanceof Error && error.message.includes('YouTube')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}