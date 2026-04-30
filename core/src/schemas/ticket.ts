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

export const SendGridWebhookSchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
  subject: z.string().min(1, 'subject is required'),
  text: z.string(),
  headers: z.string().min(1, 'headers is required'),
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
