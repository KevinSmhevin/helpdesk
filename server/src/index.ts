import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { hashPassword } from 'better-auth/crypto'
import { auth } from './lib/auth.ts'
import { requireAdmin } from './lib/middleware.ts'
import prisma from './lib/prisma.ts'

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET === 'change-me') {
  throw new Error('BETTER_AUTH_SECRET must be set to a strong random value (openssl rand -base64 32)')
}

const app = express()
const port = process.env.PORT ?? 3000

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)

app.use(helmet())
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

app.use('/api/auth/sign-in', authLimiter)
app.all('/api/auth/*', toNodeHandler(auth))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/users', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

app.post('/api/users', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return void res.status(400).json({ error: 'name, email, and password are required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return void res.status(409).json({ error: 'A user with that email already exists' })
  }

  const id = crypto.randomUUID()
  const hashed = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role: 'agent',
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: hashed,
        },
      },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  res.status(201).json(user)
})

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const session = res.locals.session

  if (session.user.id === id) {
    return void res.status(400).json({ error: 'You cannot delete your own account' })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return void res.status(404).json({ error: 'User not found' })
  }

  await prisma.user.delete({ where: { id } })
  res.status(204).send()
})

async function start() {
  await prisma.$connect()
  console.log('Database connected')

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
