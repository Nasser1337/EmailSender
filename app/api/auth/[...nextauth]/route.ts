import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// In-memory store for rate limiting
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>()

const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const MAX_ATTEMPTS = 5

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const identifier = credentials.username.toLowerCase()
        const now = Date.now()

        // Check if account is locked
        const attempts = loginAttempts.get(identifier)
        if (attempts?.lockedUntil && attempts.lockedUntil > now) {
          const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60)
          throw new Error(`Account locked. Try again in ${remainingTime} minute(s).`)
        }

        // Validate credentials
        const validUsername = 'Medidental'
        const validPassword = 'Verjaardag161090'

        if (
          credentials.username === validUsername &&
          credentials.password === validPassword
        ) {
          // Clear failed attempts on successful login
          loginAttempts.delete(identifier)

          return {
            id: '1',
            name: validUsername,
            email: 'admin@medidental.com',
          }
        }

        // Failed login - increment attempts
        const currentAttempts = attempts?.count || 0
        const newAttempts = currentAttempts + 1

        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock the account
          loginAttempts.set(identifier, {
            count: newAttempts,
            lockedUntil: now + LOCKOUT_DURATION,
          })
          throw new Error(`Too many failed attempts. Account locked for 5 minutes.`)
        } else {
          loginAttempts.set(identifier, {
            count: newAttempts,
          })
          throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`)
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
