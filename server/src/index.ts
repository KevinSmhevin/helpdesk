import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.ts'
import prisma from './lib/prisma.ts'
import usersRouter from './routes/users.ts'

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

app.use('/api/users', usersRouter)

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
