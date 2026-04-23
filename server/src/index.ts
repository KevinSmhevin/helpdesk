import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.ts'
import prisma from './lib/prisma.ts'

const app = express()
const port = process.env.PORT ?? 3000

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)

app.all('/api/auth/*', toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
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
