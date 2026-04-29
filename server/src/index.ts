import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.ts'
import prisma from './lib/prisma.ts'
import usersRouter from './routes/users.ts'
import ticketsRouter from './routes/tickets.ts'
import agentsRouter from './routes/agents.ts'
import webhooksRouter from './routes/webhooks.ts'

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET === 'change-me') {
  throw new Error('BETTER_AUTH_SECRET must be set to a strong random value (openssl rand -base64 32)')
}

if (!process.env.SENDGRID_WEBHOOK_SECRET) {
  throw new Error('SENDGRID_WEBHOOK_SECRET must be set')
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

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/sign-in', authLimiter)
}
app.all('/api/auth/*', toNodeHandler(auth))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/users', usersRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/webhooks', webhooksRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const code = (err as { code?: string })?.code
  if (code === 'P2002') {
    return void res.status(200).json({ ok: true })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
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
