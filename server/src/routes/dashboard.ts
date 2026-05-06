import { Router } from 'express'
import prisma from '../lib/prisma.ts'
import { requireAuth } from '../lib/middleware.ts'
import type { DashboardData } from '@helpdesk/core'
import type { RawCount, RawAvgHours, RawDayCount } from '../types/dashboard.ts'

const router = Router()

router.use(requireAuth)

router.get('/', async (_req, res) => {
  const [totalRows, openRows, aiRows, avgRows, perDayRows] = await Promise.all([
    prisma.$queryRaw<RawCount[]>`SELECT dashboard_total_tickets() AS count`,
    prisma.$queryRaw<RawCount[]>`SELECT dashboard_open_tickets() AS count`,
    prisma.$queryRaw<RawCount[]>`SELECT dashboard_resolved_by_ai() AS count`,
    prisma.$queryRaw<RawAvgHours[]>`SELECT dashboard_avg_resolution_hours() AS avg_hours`,
    prisma.$queryRaw<RawDayCount[]>`SELECT * FROM dashboard_tickets_per_day()`,
  ])

  const totalTickets = Number(totalRows[0].count)
  const openTickets = Number(openRows[0].count)
  const resolvedByAI = Number(aiRows[0].count)

  const countByDate = new Map(perDayRows.map((r) => [r.date, Number(r.count)]))
  const ticketsPerDay: DashboardData['ticketsPerDay'] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    ticketsPerDay.push({ date: dateStr, count: countByDate.get(dateStr) ?? 0 })
  }

  const resolvedByAIPercent = totalTickets > 0 ? (resolvedByAI / totalTickets) * 100 : 0

  const data: DashboardData = {
    totalTickets,
    openTickets,
    resolvedByAI,
    resolvedByAIPercent,
    avgResolutionTimeHours: avgRows[0]?.avg_hours ?? null,
    ticketsPerDay,
  }

  res.json(data)
})

export default router
