import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'

const router = Router()

router.use(requireAuth)

router.get('/', async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { deletedAt: null, role: Role.agent },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  res.json(agents)
})

export default router
