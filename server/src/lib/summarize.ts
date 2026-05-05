import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

type ReplyForSummary = { body: string; senderType: string }

export async function summarizeTicket(
  subject: string,
  body: string,
  replies: ReplyForSummary[],
): Promise<string> {
  const replyThread = replies
    .map((r) => `[${r.senderType === 'agent' ? 'Agent' : 'Customer'}]: ${r.body}`)
    .join('\n\n')

  const prompt = `Ticket subject: ${subject}\n\nOriginal message:\n${body}${replyThread ? `\n\nConversation thread:\n${replyThread}` : ''}`

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system:
      "You are a helpful assistant that summarizes customer support tickets. Provide a concise summary covering: the customer's issue, any key details, and any resolution reached. Keep the summary to 2-4 sentences. Return only the summary with no extra commentary or preamble.",
    prompt,
  })

  return text
}
