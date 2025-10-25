import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ 
    message: 'Headers test endpoint',
    timestamp: new Date().toISOString()
  })

  // Explicitly set fullscreen permissions policy headers
  response.headers.set('Permissions-Policy', 'fullscreen=(self)')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}
