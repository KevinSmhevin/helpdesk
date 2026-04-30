import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { TicketStatus, TicketCategory } from '@helpdesk/core'
import BackToTickets from './BackToTickets'
import TicketDetailSkeleton from './TicketDetailSkeleton'
import TicketMetaPanel from './TicketMetaPanel'
import TicketMessagePanel from './TicketMessagePanel'
import TicketReplyThread from './TicketReplyThread'

export type Agent = { id: string; name: string; email: string }

export type TicketDetail = {
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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: () => api.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>('/api/agents').then((r) => r.data),
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <BackToTickets />

      {isLoading ? (
        <TicketDetailSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load ticket. Please try again.</p>
      ) : ticket ? (
        <>
          <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
          <TicketMetaPanel ticketId={ticket.id} ticket={ticket} agents={agents} />
          <TicketMessagePanel body={ticket.body} />
          <TicketReplyThread ticketId={ticket.id} fromName={ticket.fromName} fromEmail={ticket.fromEmail} />
        </>
      ) : null}
    </div>
  )
}
