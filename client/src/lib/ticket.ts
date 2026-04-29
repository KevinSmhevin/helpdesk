import { TicketStatus } from '@helpdesk/core'

export const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.open]: 'bg-primary/10 text-primary',
  [TicketStatus.resolved]: 'bg-green-100 text-green-700',
  [TicketStatus.closed]: 'bg-muted text-muted-foreground',
}
