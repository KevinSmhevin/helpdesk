import { z } from 'zod'
import { TicketCategory, TicketStatus } from '../enums/ticket.ts'

export type Agent = { id: string; name: string; email: string }

export type Ticket = {
  id: string
  subject: string
  body: string
  fromEmail: string
  fromName: string | null
  toEmail: string
  status: TicketStatus
  category: TicketCategory | null
  messageId: string
  inReplyTo: string | null
  assignedTo: Agent | null
  createdAt: string
  updatedAt: string
}

export const TicketCategoryLabels: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: 'General Question',
  [TicketCategory.technical_question]: 'Technical Question',
  [TicketCategory.refund_request]: 'Refund Request',
}

// Limits for incoming SendGrid webhook payloads. Applied at the schema layer so
// malicious or runaway emails cannot push oversized rows into Postgres.
//   FROM/TO   — RFC 5321 caps an addr-spec at 320 chars; 500 leaves headroom for
//               display names and angle brackets ("Alice Smith <alice@example.com>").
//   SUBJECT   — RFC 2822 line-length max is 998 chars.
//   BODY      — 100 KB plaintext is well above any legitimate support email.
//   HEADERS   — full header block can grow with many Received: hops; 50 KB is generous.
const FROM_TO_MAX = 500
const SUBJECT_MAX = 998
const BODY_MAX = 100_000
const HEADERS_MAX = 50_000

export const SendGridWebhookSchema = z.object({
  from: z
    .string()
    .min(1, 'from is required')
    .max(FROM_TO_MAX, `from must be ${FROM_TO_MAX} characters or fewer`),
  to: z
    .string()
    .min(1, 'to is required')
    .max(FROM_TO_MAX, `to must be ${FROM_TO_MAX} characters or fewer`),
  subject: z
    .string()
    .min(1, 'subject is required')
    .max(SUBJECT_MAX, `subject must be ${SUBJECT_MAX} characters or fewer`),
  text: z.string().max(BODY_MAX, `text must be ${BODY_MAX} characters or fewer`),
  headers: z
    .string()
    .min(1, 'headers is required')
    .max(HEADERS_MAX, `headers must be ${HEADERS_MAX} characters or fewer`),
})

export type SendGridWebhookInput = z.infer<typeof SendGridWebhookSchema>

export const UpdateTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategory).nullable().optional(),
})

export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>

export const CreateReplySchema = z.object({
  body: z.string().min(1, 'Reply body is required'),
})

export type CreateReplyInput = z.infer<typeof CreateReplySchema>
