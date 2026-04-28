import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import prisma from '../lib/prisma.ts'
import { SendGridWebhookSchema } from '@helpdesk/core'

const router = Router()

const upload = multer({ storage: multer.memoryStorage() })

const Errors = {
  INVALID_TOKEN: 'Unauthorized',
  INVALID_PAYLOAD: 'Invalid webhook payload',
} as const

function requireWebhookToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.SENDGRID_WEBHOOK_SECRET
  const provided = req.query['token']
  if (!provided || provided !== expected) {
    return void res.status(401).json({ error: Errors.INVALID_TOKEN })
  }
  next()
}

function parseHeaders(raw: string): { messageId: string | null; inReplyTo: string | null } {
  const normalized = raw.replace(/\r\n/g, '\n')
  const strip = (val: string) => val.trim().replace(/^<|>$/g, '')
  const messageIdMatch = normalized.match(/^Message-ID:\s*(.+)$/im)
  const inReplyToMatch = normalized.match(/^In-Reply-To:\s*(.+)$/im)
  return {
    messageId: messageIdMatch ? strip(messageIdMatch[1]) : null,
    inReplyTo: inReplyToMatch ? strip(inReplyToMatch[1]) : null,
  }
}

function parseFrom(from: string): { fromEmail: string; fromName: string | null } {
  const match = from.match(/^(?:"?(.+?)"?\s)?<?([^\s<>]+@[^\s<>]+)>?$/)
  if (!match) return { fromEmail: from.trim(), fromName: null }
  return { fromEmail: match[2].trim(), fromName: match[1]?.trim() ?? null }
}

function parseEmail(address: string): string {
  const match = address.match(/<([^>]+)>/)
  return match ? match[1] : address.trim()
}

router.post('/email', requireWebhookToken, upload.none(), async (req: Request, res: Response) => {
  const result = SendGridWebhookSchema.safeParse(req.body)
  if (!result.success) {
    return void res.status(400).json({ error: result.error.issues[0].message })
  }

  const { from, to, subject, text, headers } = result.data
  const { messageId, inReplyTo } = parseHeaders(headers)

  if (!messageId) {
    return void res.status(400).json({ error: Errors.INVALID_PAYLOAD })
  }

  // Deduplication: return 200 (not 4xx) so SendGrid does not retry
  const existing = await prisma.ticket.findUnique({ where: { messageId } })
  if (existing) {
    return void res.status(200).json({ ok: true })
  }

  const { fromEmail, fromName } = parseFrom(from)
  const toEmail = parseEmail(to)

  await prisma.ticket.create({
    data: {
      subject: subject.trim(),
      body: text.trim(),
      fromEmail,
      fromName,
      toEmail,
      messageId,
      inReplyTo,
    },
  })

  res.status(200).json({ ok: true })
})

export default router
