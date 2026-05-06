import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SenderType } from '@prisma/client'
import { TicketStatus } from '@helpdesk/core'
import prisma from './prisma.ts'
import { AUTO_RESOLVER_EMAIL } from './constants.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const knowledgeBase = readFileSync(join(__dirname, '../data/knowledge-base.md'), 'utf-8')

const ResolutionSchema = z.object({
  canResolve: z
    .boolean()
    .describe('Whether the ticket can be fully resolved using the knowledge base'),
  reply: z
    .string()
    .optional()
    .describe('The reply to send the customer — required when canResolve is true'),
})

async function getAutoResolverId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: AUTO_RESOLVER_EMAIL },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function autoResolveTicket(
  ticketId: string,
  subject: string,
  body: string,
  fromName: string | null,
): Promise<void> {
  await prisma.ticket.update({ where: { id: ticketId }, data: { status: TicketStatus.processing } })

  const customerFirstName = fromName?.split(' ')[0] ?? null
  const greeting = customerFirstName ? `Hi ${customerFirstName},` : 'Hi there,'

  let resolvedReply: string | undefined
  let finalStatus = TicketStatus.open

  try {
    const { output } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: ResolutionSchema }),
      system: `You are a customer support agent for Code with Mosh, an online coding education platform.

Your task: decide if the customer's ticket can be fully resolved using the knowledge base below. If yes, write a complete, professional reply. If not, escalate to a human agent.

Always escalate (canResolve: false) when:
- The issue is not covered or is ambiguous in the knowledge base
- The customer requests a refund outside the 30-day window
- The customer mentions a chargeback, payment dispute, or legal action
- The issue involves account security concerns
- You are not fully confident in your answer

When writing a reply (canResolve: true):
- Open with "${greeting}"
- Use a warm, professional, and helpful tone
- Use short paragraphs; use a numbered list for multi-step instructions and bullet points for options or reasons
- Close with "Best regards,\\nCode with Mosh Support Team"

Knowledge Base:
${knowledgeBase}`,
      prompt: `Ticket subject: ${subject}\n\nCustomer message:\n${body}`,
    })

    if (output?.canResolve && output.reply) {
      resolvedReply = output.reply
      finalStatus = TicketStatus.resolved
    }
  } catch (err) {
    console.error('[auto-resolve] AI call failed for ticket', ticketId, err)
  }

  const autoResolverId = await getAutoResolverId()

  try {
    await prisma.$transaction(async (tx) => {
      if (resolvedReply) {
        await tx.reply.create({
          data: {
            ticketId,
            body: resolvedReply,
            senderType: SenderType.agent,
            userId: autoResolverId,
          },
        })
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: finalStatus,
            resolvedByAI: true,
            resolvedAt: new Date(),
          },
        })
      } else {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: finalStatus,
            assignedToId: null,
          },
        })
      }
    })
  } catch (err) {
    console.error('[auto-resolve] DB transaction failed for ticket', ticketId, err)
    await prisma.ticket
      .update({ where: { id: ticketId }, data: { status: TicketStatus.open, assignedToId: null } })
      .catch(() => {})
  }
}
