import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from './auth'
import { db } from './db'

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  name?: string
  instruments: string[]
}

/**
 * Robust authentication check that validates session and user data
 * @param requireAuth - Whether to redirect to signin if not authenticated
 * @returns AuthenticatedUser or null
 */
export async function getAuthenticatedUser(requireAuth: boolean = true): Promise<AuthenticatedUser | null> {
  try {
    // Get the session
    const session = await getServerSession(authOptions)
    
    // If no session and auth is required, redirect to signin
    if (!session?.user?.id) {
      if (requireAuth) {
        redirect('/auth/signin')
      }
      return null
    }

    // Validate that the user still exists in the database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id }
    })

    // If user doesn't exist in database, clear session and redirect
    if (!dbUser) {
      console.warn(`Session exists but user ${session.user.id} not found in database`)
      if (requireAuth) {
        redirect('/auth/signin')
      }
      return null
    }

    // Parse instruments from database
    const instruments = JSON.parse(dbUser.instruments || '[]')

    // Return validated user data
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      name: dbUser.name || undefined,
      instruments
    }
  } catch (error) {
    console.error('Authentication check failed:', error)
    
    // On error, redirect to signin if auth is required
    if (requireAuth) {
      redirect('/auth/signin')
    }
    return null
  }
}

/**
 * Check if user is authenticated without redirecting
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser(false)
    return user !== null
  } catch {
    return false
  }
}

/**
 * Get user's bands with proper error handling
 * @param userId - User ID
 * @returns Array of bands or empty array
 */
export async function getUserBands(userId: string) {
  try {
    const userBands = await db.bandMember.findMany({
      where: { userId },
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

    return userBands.map(membership => ({
      ...membership.band,
      role: membership.role,
      joinedAt: membership.joinedAt
    }))
  } catch (error) {
    console.error('Failed to fetch user bands:', error)
    return []
  }
}
