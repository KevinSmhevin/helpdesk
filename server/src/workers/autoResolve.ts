import type { Job } from 'pg-boss'
import boss from '../lib/boss.ts'
import { autoResolveTicket } from '../lib/autoResolve.ts'

export const AUTO_RESOLVE_QUEUE = 'auto-resolve-ticket'

type AutoResolveJobData = {
  ticketId: string
  subject: string
  body: string
  fromName: string | null
}

export async function registerAutoResolveWorker() {
  await boss.createQueue(AUTO_RESOLVE_QUEUE)
  await boss.work(AUTO_RESOLVE_QUEUE, async (jobs: Job<AutoResolveJobData>[]) => {
    const { ticketId, subject, body, fromName } = jobs[0].data
    await autoResolveTicket(ticketId, subject, body, fromName)
  })
}
