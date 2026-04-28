import { Router } from 'express'
import { requireAuth } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'

const router = Router()

router.use(requireAuth)

const SORTABLE_COLUMNS = new Set(['subject', 'fromEmail', 'status', 'category', 'createdAt'])
const SORT_ORDERS = new Set(['asc', 'desc'])

router.get('/', async (req, res) => {
  const sortBy =
    typeof req.query.sortBy === 'string' && SORTABLE_COLUMNS.has(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt'

  const sortOrder =
    typeof req.query.sortOrder === 'string' && SORT_ORDERS.has(req.query.sortOrder)
      ? (req.query.sortOrder as 'asc' | 'desc')
      : 'desc'

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
    orderBy: { [sortBy]: sortOrder },
  })
  res.json(tickets)
})

export default router
