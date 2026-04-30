import { Search, X } from 'lucide-react'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  searchInput: string
  onSearchChange: (v: string) => void
  status: TicketStatus | 'all'
  onStatusChange: (v: TicketStatus | 'all') => void
  category: TicketCategory | 'all'
  onCategoryChange: (v: TicketCategory | 'all') => void
  hasActiveFilters: boolean
  onClear: () => void
}

export default function TicketsFilters({
  searchInput,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  hasActiveFilters,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tickets…"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-64"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => onStatusChange(v as TicketStatus | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={TicketStatus.open}>Open</SelectItem>
            <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
            <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => onCategoryChange(v as TicketCategory | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value={TicketCategory.general_question}>
              {TicketCategoryLabels[TicketCategory.general_question]}
            </SelectItem>
            <SelectItem value={TicketCategory.technical_question}>
              {TicketCategoryLabels[TicketCategory.technical_question]}
            </SelectItem>
            <SelectItem value={TicketCategory.refund_request}>
              {TicketCategoryLabels[TicketCategory.refund_request]}
            </SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
