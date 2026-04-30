import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  onPageChange: (page: number) => void
}

export default function TicketsPagination({ page, totalPages, total, from, to, onPageChange }: Props) {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {from}–{to} of {total}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
