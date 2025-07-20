import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchYouTubeVideos } from '@/lib/youtube'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const results = await searchYouTubeVideos(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube videos' }, 
      { status: 500 }
    )
  }
}