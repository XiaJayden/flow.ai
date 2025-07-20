'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Music className="h-6 w-6" />
          <span className="text-xl font-bold">Flow.ai</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/bands">
                <Button variant="ghost">Bands</Button>
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {session.user.username}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}