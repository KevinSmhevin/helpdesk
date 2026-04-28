import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { TicketSortColumn, SortOrder } from '@helpdesk/core'
import { requireAuth } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'

const router = Router()

router.use(requireAuth)

const SORTABLE_COLUMNS = new Set<string>(Object.values(TicketSortColumn))
const SORT_ORDERS = new Set<string>(Object.values(SortOrder))
const VALID_STATUSES = new Set(['open', 'resolved', 'closed'])
const VALID_CATEGORIES = new Set(['general_question', 'technical_question', 'refund_request'])

router.get('/', async (req, res) => {
  const sortBy =
    typeof req.query.sortBy === 'string' && SORTABLE_COLUMNS.has(req.query.sortBy)
      ? (req.query.sortBy as TicketSortColumn)
      : TicketSortColumn.createdAt

  const sortOrder =
    typeof req.query.sortOrder === 'string' && SORT_ORDERS.has(req.query.sortOrder)
      ? (req.query.sortOrder as SortOrder)
      : SortOrder.desc

  const where: Prisma.TicketWhereInput = {}

  if (typeof req.query.status === 'string' && VALID_STATUSES.has(req.query.status)) {
    where.status = req.query.status as Prisma.EnumTicketStatusFilter
  }

  if (typeof req.query.category === 'string' && VALID_CATEGORIES.has(req.query.category)) {
    where.category = req.query.category as Prisma.EnumTicketCategoryNullableFilter
  }

  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const q = req.query.search.trim()
    where.OR = [
      { subject: { contains: q, mode: 'insensitive' } },
      { fromEmail: { contains: q, mode: 'insensitive' } },
      { fromName: { contains: q, mode: 'insensitive' } },
    ]
  }

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
    where,
    orderBy: { [sortBy]: sortOrder },
  })
  res.json(tickets)
})

export default router
