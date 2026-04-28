import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Ticket = {
  id: string
  subject: string
  fromEmail: string
  fromName: string | null
  status: TicketStatus
  category: TicketCategory | null
  createdAt: string
}

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.open]: 'bg-primary/10 text-primary',
  [TicketStatus.resolved]: 'bg-green-100 text-green-700',
  [TicketStatus.closed]: 'bg-muted text-muted-foreground',
}

export default function TicketsPage() {
  const { data: tickets = [], isLoading, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => api.get<Ticket[]>('/api/tickets').then((r) => r.data),
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
      {isLoading ? (
        <TicketsTableSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load tickets. Please try again.</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Subject</TableHead>
                <TableHead className="px-4">From</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Category</TableHead>
                <TableHead className="px-4">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="px-4 font-medium text-foreground max-w-xs truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    <div>{ticket.fromName ?? ticket.fromEmail}</div>
                    {ticket.fromName && (
                      <div className="text-xs text-muted-foreground/70">{ticket.fromEmail}</div>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[ticket.status]}`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {ticket.category ? TicketCategoryLabels[ticket.category] : '—'}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function TicketsTableSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Subject</TableHead>
            <TableHead className="px-4">From</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4"><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
