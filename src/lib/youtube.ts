export interface YouTubeSearchResult {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: number
  publishedAt: string
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured')
  }

  try {
    // Search for videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '10',
        key: apiKey,
        videoEmbeddable: 'true',
        videoCategoryId: '10' // Music category
      })
    )

    if (!searchResponse.ok) {
      throw new Error('Failed to search YouTube')
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return []
    }

    // Get video details including duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({
        part: 'contentDetails,snippet',
        id: videoIds,
        key: apiKey
      })
    )

    if (!detailsResponse.ok) {
      throw new Error('Failed to get video details')
    }

    const detailsData = await detailsResponse.json()

    return detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      duration: parseDuration(item.contentDetails.duration),
      publishedAt: item.snippet.publishedAt
    }))

  } catch (error) {
    console.error('YouTube API error:', error)
    throw new Error('Failed to search YouTube videos')
  }
}

export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured')
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({
        part: 'snippet,contentDetails',
        id: videoId,
        key: apiKey
      })
    
    console.log('Fetching YouTube video details for:', videoId)
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('YouTube API error:', response.status, response.statusText, errorText)
      
      // Handle specific YouTube API errors
      if (response.status === 403) {
        throw new Error('YouTube API key is invalid or quota exceeded')
      } else if (response.status === 400) {
        throw new Error('Invalid video ID or malformed request')
      }
      
      throw new Error(`Failed to get video details: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('YouTube API response:', JSON.stringify(data, null, 2))
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found or is private/restricted')
    }

    const item = data.items[0]
    
    return {
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      duration: parseDuration(item.contentDetails.duration),
      publishedAt: item.snippet.publishedAt
    }

  } catch (error) {
    console.error('YouTube API error:', error)
    throw new Error('Failed to get video details')
  }
}

// Parse YouTube duration format (PT4M13S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

// Extract video ID from various YouTube URL formats
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}