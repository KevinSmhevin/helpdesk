import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { TicketCategory } from '@helpdesk/core'
import prisma from './prisma.ts'

const VALID_CATEGORIES = new Set<string>(Object.values(TicketCategory))

export async function classifyTicket(ticketId: string, subject: string, body: string): Promise<void> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system:
      'You are a customer support classifier. Classify the ticket into exactly one of these categories:\n' +
      '- general_question\n' +
      '- technical_question\n' +
      '- refund_request\n\n' +
      'Reply with only the category name, nothing else.',
    prompt: `Subject: ${subject}\n\nMessage:\n${body}`,
  })

  const category = text.trim().toLowerCase()
  if (!VALID_CATEGORIES.has(category)) return

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { category: category as TicketCategory },
  })
}
