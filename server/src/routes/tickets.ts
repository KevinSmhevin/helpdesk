import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { TicketSortColumn, SortOrder, AssignTicketSchema } from '@helpdesk/core'
import { requireAuth } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'

const router = Router()

router.use(requireAuth)

const DEFAULT_PAGE_SIZE = 10
const SORTABLE_COLUMNS = new Set<string>(Object.values(TicketSortColumn))
const SORT_ORDERS = new Set<string>(Object.values(SortOrder))
const VALID_STATUSES = new Set(['open', 'resolved', 'closed'])
const VALID_CATEGORIES = new Set(['general_question', 'technical_question', 'refund_request'])

const Errors = {
  TICKET_NOT_FOUND: 'Ticket not found',
  AGENT_NOT_FOUND: 'Assigned user not found',
} as const

const assignedToSelect = {
  id: true,
  name: true,
  email: true,
} as const

router.get('/', async (req, res) => {
  const sortBy =
    typeof req.query.sortBy === 'string' && SORTABLE_COLUMNS.has(req.query.sortBy)
      ? (req.query.sortBy as TicketSortColumn)
      : TicketSortColumn.createdAt

  const sortOrder =
    typeof req.query.sortOrder === 'string' && SORT_ORDERS.has(req.query.sortOrder)
      ? (req.query.sortOrder as SortOrder)
      : SortOrder.desc

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = DEFAULT_PAGE_SIZE

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

  const orderBy = { [sortBy]: sortOrder }

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        status: true,
        category: true,
        createdAt: true,
        assignedTo: { select: assignedToSelect },
      },
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  res.json({ tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

router.get('/:id', async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { assignedTo: { select: assignedToSelect } },
  })

  if (!ticket) {
    res.status(404).json({ error: Errors.TICKET_NOT_FOUND })
    return
  }

  res.json(ticket)
})

router.patch('/:id', async (req, res) => {
  const result = AssignTicketSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message })
    return
  }

  const { assignedToId } = result.data

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } })
  if (!ticket) {
    res.status(404).json({ error: Errors.TICKET_NOT_FOUND })
    return
  }

  if (assignedToId !== null) {
    const agent = await prisma.user.findUnique({ where: { id: assignedToId, deletedAt: null } })
    if (!agent) {
      res.status(422).json({ error: Errors.AGENT_NOT_FOUND })
      return
    }
  }

  const updated = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { assignedToId },
    include: { assignedTo: { select: assignedToSelect } },
  })

  res.json(updated)
})

export default router
