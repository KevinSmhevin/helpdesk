import { fromNodeHeaders } from 'better-auth/node'
import { Role } from '@prisma/client'
import { auth } from './auth.ts'
import type { Request, Response, NextFunction } from 'express'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) return void res.status(401).json({ error: 'Unauthenticated' })
  res.locals.session = session
  next()
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) return void res.status(401).json({ error: 'Unauthenticated' })
  if ((session.user as { role?: Role }).role !== Role.admin) {
    return void res.status(403).json({ error: 'Forbidden' })
  }
  res.locals.session = session
  next()
}
