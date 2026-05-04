import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function polishReply(
  draft: string,
  ticketSubject: string,
  agentName: string,
  customerFirstName: string | null,
): Promise<string> {
  const customerLine = customerFirstName ? `Customer first name: ${customerFirstName}` : ''
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system:
      'You are a professional customer support agent. Improve the provided draft reply: fix grammar and spelling, make the tone polite and helpful, and keep it concise.' +
      (customerFirstName ? ' Open with a greeting that addresses the customer by their first name.' : '') +
      ' End the reply with a sign-off on its own line using the provided agent name (e.g. "Best,\\n<name>"). Return only the improved reply text with no extra commentary or preamble.',
    prompt: `Ticket subject: ${ticketSubject}\nAgent name: ${agentName}${customerLine ? `\n${customerLine}` : ''}\n\nDraft reply:\n${draft}`,
  })
  return text
}
