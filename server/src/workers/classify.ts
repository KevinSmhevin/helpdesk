import type { Job } from 'pg-boss'
import boss from '../lib/boss.ts'
import { classifyTicket } from '../lib/classify.ts'

export const CLASSIFY_QUEUE = 'classify-ticket'

type ClassifyJobData = { ticketId: string; subject: string; body: string }

export async function registerClassifyWorker() {
  await boss.createQueue(CLASSIFY_QUEUE)
  await boss.work(CLASSIFY_QUEUE, async (jobs: Job<ClassifyJobData>[]) => {
    const { ticketId, subject, body } = jobs[0].data
    await classifyTicket(ticketId, subject, body)
  })
}
