import { useQueryClient, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels, type Ticket, type Agent } from '@helpdesk/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

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

export default function TicketMetaPanel({
  ticketId,
  ticket,
  agents,
}: {
  ticketId: string
  ticket: Ticket
  agents: Agent[]
}) {
  const queryClient = useQueryClient()

  function updateCache(updated: Ticket) {
    queryClient.setQueryData<Ticket>(['ticket', ticketId], updated)
  }

  const statusMutation = useMutation({
    mutationFn: (value: TicketStatus) =>
      api.patch<Ticket>(`/api/tickets/${ticketId}`, { status: value }).then((r) => r.data),
    onSuccess: updateCache,
  })

  const categoryMutation = useMutation({
    mutationFn: (value: TicketCategory | null) =>
      api.patch<Ticket>(`/api/tickets/${ticketId}`, { category: value }).then((r) => r.data),
    onSuccess: updateCache,
  })

  const assignMutation = useMutation({
    mutationFn: (value: string | null) =>
      api.patch<Ticket>(`/api/tickets/${ticketId}`, { assignedToId: value }).then((r) => r.data),
    onSuccess: updateCache,
  })

  return (
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
  )
}
