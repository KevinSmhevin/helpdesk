import { Router } from 'express'
import { requireAuth } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'

const router = Router()

router.use(requireAuth)

router.get('/', async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      fromName: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(tickets)
})

export default router
