import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { Role } from '@prisma/client'
import { requireAdmin } from '../lib/middleware.ts'
import prisma from '../lib/prisma.ts'
import { CreateUserSchema } from '@helpdesk/core'

const router = Router()

router.use(requireAdmin)

const Errors = {
  EMAIL_TAKEN: 'A user with that email already exists',
  USER_NOT_FOUND: 'User not found',
  CANNOT_DELETE_SELF: 'You cannot delete your own account',
} as const

const CREDENTIAL_PROVIDER_ID = 'credential'

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

router.post('/', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body)
  if (!result.success) {
    return void res.status(400).json({ error: result.error.issues[0].message })
  }

  const { name, email, password } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return void res.status(409).json({ error: Errors.EMAIL_TAKEN })
  }

  const id = crypto.randomUUID()
  const hashed = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role: Role.agent,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: CREDENTIAL_PROVIDER_ID,
          password: hashed,
        },
      },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  res.status(201).json(user)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const session = res.locals.session

  if (session.user.id === id) {
    return void res.status(400).json({ error: Errors.CANNOT_DELETE_SELF })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return void res.status(404).json({ error: Errors.USER_NOT_FOUND })
  }

  await prisma.user.delete({ where: { id } })
  res.status(204).send()
})

export default router
