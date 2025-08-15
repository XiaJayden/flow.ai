'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { InstrumentAvatar } from '@/components/ui/instrument-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Music, User, Settings, LogOut, Bell, Plus, ChevronDown } from 'lucide-react'
import { parseInstruments } from '@/lib/utils'

export function Navbar() {
  const { data: session } = useSession()

  const getUserInitials = (user: any) => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Get user's instruments from session if available
  const userInstruments = session?.user ? parseInstruments((session.user as any).instruments || '[]') : []

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left: Logo and Flow.ai */}
        <Link href="/" className="flex items-center space-x-4">
          <div className="relative translate-y-0.25">
            <Image
              src="/flow_logo.png"
              alt="Flow.ai Logo"
              width={56}
              height={56}
              className="rounded-md"
            />
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flow.ai
            </span>
          </div>
        </Link>
        
        <div className="ml-auto flex items-center space-x-3 translate-x-1">
          {session ? (
            <>
              {/* View Switch Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-10 px-4 rounded-2xl bg-background/60 backdrop-blur border-border/80 hover:bg-muted/50 transition-all duration-200"
                  >
                    <span className="font-medium">Dashboard</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuItem className="font-medium">
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Your Bands
                  </div>
                  <DropdownMenuItem>
                    <Music className="mr-2 h-4 w-4" />
                    <span>Jamberry</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Music className="mr-2 h-4 w-4" />
                    <span>Paramore</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create New Band</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Join Band</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notification Bell */}
              <Button 
                variant="outline" 
                size="icon"
                className="relative h-10 w-10 rounded-full border-border/80 bg-background/60 backdrop-blur hover:bg-muted/50 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
              </Button>

              {/* User Info */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    className="h-10 px-3 rounded-2xl bg-background/60 backdrop-blur border-border/80 hover:bg-muted/50 transition-all duration-200 min-w-32"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <InstrumentAvatar
                        src={undefined}
                        alt={session.user?.username || 'User'}
                        instruments={userInstruments}
                        fallbackText={getUserInitials(session.user)}
                        className="h-8 w-8 flex-shrink-0"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-medium leading-none truncate">
                          {session.user?.name || session.user?.username}
                        </div>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        @{session.user?.username}
                      </p>
                      {userInstruments.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {userInstruments.slice(0, 2).join(', ')}
                          {userInstruments.length > 2 && ` +${userInstruments.length - 2} more`}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="cursor-not-allowed">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="cursor-not-allowed">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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