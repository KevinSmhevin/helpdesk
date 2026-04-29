import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { statusStyles } from '@/lib/ticket'
import { cn } from '@/lib/utils'

type TicketDetail = {
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
  createdAt: string
  updatedAt: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: () => api.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
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
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ticket.status]}`}
              >
                {ticket.status}
              </span>
              {ticket.category && (
                <span className="text-xs text-muted-foreground">
                  {TicketCategoryLabels[ticket.category]}
                </span>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border border-border rounded-xl p-5">
            <Field label="From">
              {ticket.fromName ? (
                <span>
                  {ticket.fromName}{' '}
                  <span className="text-muted-foreground">({ticket.fromEmail})</span>
                </span>
              ) : (
                ticket.fromEmail
              )}
            </Field>
            <Field label="To">{ticket.toEmail}</Field>
            <Field label="Received">
              {new Date(ticket.createdAt).toLocaleString()}
            </Field>
            <Field label="Last updated">
              {new Date(ticket.updatedAt).toLocaleString()}
            </Field>
          </dl>

          <div className="border border-border rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Message
            </h2>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {ticket.body}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="border border-border rounded-xl p-5 grid grid-cols-2 gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="border border-border rounded-xl p-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}
