import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import type { UpdateTicketInput } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Agent = { id: string; name: string; email: string }

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
  assignedTo: Agent | null
  createdAt: string
  updatedAt: string
}

const NO_CATEGORY = '__no_category__'
const UNASSIGNED = '__unassigned__'

const statusLabels: Record<TicketStatus, string> = {
  [TicketStatus.open]: 'Open',
  [TicketStatus.resolved]: 'Resolved',
  [TicketStatus.closed]: 'Closed',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function EditableSelect({
  value,
  displayValue,
  onValueChange,
  disabled,
  isError,
  errorMessage,
  children,
}: {
  value: string
  displayValue: string
  onValueChange: (v: string) => void
  disabled: boolean
  isError: boolean
  errorMessage: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Select value={value} onValueChange={(v) => v !== null && onValueChange(v)} disabled={disabled}>
        <SelectTrigger className="mt-1 w-full">
          <span className="flex flex-1 text-left text-sm">{displayValue}</span>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {isError && <p className="mt-1 text-xs text-destructive">{errorMessage}</p>}
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: () => api.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>('/api/agents').then((r) => r.data),
  })

  function makeUpdateMutation(field: keyof UpdateTicketInput) {
    return useMutation({
      mutationFn: (value: UpdateTicketInput[typeof field]) =>
        api.patch<TicketDetail>(`/api/tickets/${id}`, { [field]: value }).then((r) => r.data),
      onSuccess: (updated) => {
        queryClient.setQueryData<TicketDetail>(['ticket', id], updated)
      },
    })
  }

  const statusMutation = makeUpdateMutation('status')
  const categoryMutation = makeUpdateMutation('category')
  const assignMutation = makeUpdateMutation('assignedToId')

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

          <dl className="grid grid-cols-2 gap-x-8 gap-y-0 border border-border rounded-xl p-5">
            <div className="space-y-4">
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
              <Field label="Received">{new Date(ticket.createdAt).toLocaleString()}</Field>
              <Field label="Last Updated">{new Date(ticket.updatedAt).toLocaleString()}</Field>
            </div>

            <div className="space-y-4">
              <Field label="Status">
                <EditableSelect
                  value={ticket.status}
                  displayValue={statusLabels[ticket.status]}
                  onValueChange={(v) => statusMutation.mutate(v as TicketStatus)}
                  disabled={statusMutation.isPending}
                  isError={statusMutation.isError}
                  errorMessage="Failed to update status."
                >
                  <SelectItem value={TicketStatus.open}>{statusLabels[TicketStatus.open]}</SelectItem>
                  <SelectItem value={TicketStatus.resolved}>{statusLabels[TicketStatus.resolved]}</SelectItem>
                  <SelectItem value={TicketStatus.closed}>{statusLabels[TicketStatus.closed]}</SelectItem>
                </EditableSelect>
              </Field>

              <Field label="Category">
                <EditableSelect
                  value={ticket.category ?? NO_CATEGORY}
                  displayValue={ticket.category ? TicketCategoryLabels[ticket.category] : 'No Category'}
                  onValueChange={(v) => categoryMutation.mutate(v === NO_CATEGORY ? null : v as TicketCategory)}
                  disabled={categoryMutation.isPending}
                  isError={categoryMutation.isError}
                  errorMessage="Failed to update category."
                >
                  <SelectItem value={NO_CATEGORY}>No Category</SelectItem>
                  <SelectItem value={TicketCategory.general_question}>
                    {TicketCategoryLabels[TicketCategory.general_question]}
                  </SelectItem>
                  <SelectItem value={TicketCategory.technical_question}>
                    {TicketCategoryLabels[TicketCategory.technical_question]}
                  </SelectItem>
                  <SelectItem value={TicketCategory.refund_request}>
                    {TicketCategoryLabels[TicketCategory.refund_request]}
                  </SelectItem>
                </EditableSelect>
              </Field>

              <Field label="Assigned To">
                <EditableSelect
                  value={ticket.assignedTo?.id ?? UNASSIGNED}
                  displayValue={ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                  onValueChange={(v) => assignMutation.mutate(v === UNASSIGNED ? null : v)}
                  disabled={assignMutation.isPending}
                  isError={assignMutation.isError}
                  errorMessage="Failed to update assignee."
                >
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </EditableSelect>
              </Field>
            </div>
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
    </div>
  )
}
