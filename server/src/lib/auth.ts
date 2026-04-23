import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { Role } from '@prisma/client'
import prisma from './prisma.ts'

const trustedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins,
  user: {
    additionalFields: {
      role: {
        type: Object.values(Role) as [string, ...string[]],
        required: true,
        defaultValue: Role.agent,
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
