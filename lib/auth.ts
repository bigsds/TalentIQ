import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        // Check DB users first
        const user = await prisma.user.findUnique({ where: { email, actif: true } })
        if (user) {
          const valid = await bcrypt.compare(password, user.password)
          if (!valid) return null
          return { id: String(user.id), email: user.email, name: user.nom, role: user.role }
        }

        // Fallback: env admin (MVP)
        if (
          email === process.env.ADMIN_EMAIL &&
          process.env.ADMIN_PASSWORD_HASH &&
          (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH))
        ) {
          return { id: '0', email, name: 'Admin', role: 'admin' }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
})
