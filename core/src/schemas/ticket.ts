import { z } from 'zod'
import { TicketCategory } from '../enums/ticket.ts'

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
