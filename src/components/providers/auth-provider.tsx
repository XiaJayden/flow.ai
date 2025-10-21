'use client'

import { SessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function AuthChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // If session is loading, wait
    if (status === 'loading') return

    // If no session and we're on a protected route, redirect to signin
    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname
      const protectedRoutes = ['/dashboard', '/bands', '/studio']
      const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))
      
      if (isProtectedRoute) {
        console.log('No session found on protected route, redirecting to signin')
        router.push('/auth/signin')
      }
    }

    // If session exists but user data is incomplete, refresh
    if (session?.user && (!session.user.id || !session.user.username)) {
      console.warn('Session exists but user data is incomplete, refreshing...')
      window.location.reload()
    }
  }, [session, status, router])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthChecker>
        {children}
      </AuthChecker>
    </SessionProvider>
  )
}