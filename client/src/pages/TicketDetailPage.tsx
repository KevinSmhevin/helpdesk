import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { TicketStatus, TicketCategory } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
      <div>
        <Link
          to="/tickets"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 text-muted-foreground')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to tickets
        </Link>
      </div>

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

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <div className="border border-border rounded-xl p-5 grid grid-cols-2 gap-x-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="border border-border rounded-xl p-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="border border-border rounded-xl p-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
