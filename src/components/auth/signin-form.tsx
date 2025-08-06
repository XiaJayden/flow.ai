'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SignInForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        emailOrUsername,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email/username or password')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/flow_logo.png"
            alt="Flow.ai Logo"
            width={130}
            height={130}
            className="object-contain"
          />
          <div className="text-center space-y-3">
            <CardTitle className="text-2xl">Sign in to Flow.ai</CardTitle>
            <p className="text-muted-foreground">
              Collaborative practice tool for musical bands
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="emailOrUsername" className="text-sm font-medium">
              Email or Username
            </label>
            <Input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              autoComplete="username"
              required
              placeholder="Enter your email or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center">
            <Link href="/auth/signup" className="text-primary hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}