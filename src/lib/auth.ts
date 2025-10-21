import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          return null
        }

        try {
          // Check if input is email (contains @) or username
          const isEmail = credentials.emailOrUsername.includes('@')
          
          const user = await db.user.findUnique({
            where: isEmail 
              ? { email: credentials.emailOrUsername }
              : { username: credentials.emailOrUsername }
          })

          if (!user || !user.password) {
            console.warn(`Login attempt failed: user not found for ${credentials.emailOrUsername}`)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValid) {
            console.warn(`Login attempt failed: invalid password for ${credentials.emailOrUsername}`)
            return null
          }

          console.log(`Successful login for user: ${user.username} (${user.id})`)
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        // Fetch fresh user data including instruments
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id }
          })
          if (dbUser) {
            token.instruments = dbUser.instruments
            token.email = dbUser.email
            token.name = dbUser.name
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.username = token.username as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as any).instruments = token.instruments as string
      }
      return session
    }
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User signed in: ${user.username} (${user.id}) - New user: ${isNewUser}`)
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.username}`)
    }
  },
  debug: process.env.NODE_ENV === 'development'
}