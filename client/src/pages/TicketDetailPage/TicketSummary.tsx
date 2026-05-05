import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TicketSummary({ ticketId }: { ticketId: string }) {
  const [summary, setSummary] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ summary: string }>(`/api/tickets/${ticketId}/summarize`).then((r) => r.data),
    onSuccess: (result) => setSummary(result.summary),
  })

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Sparkles className="size-3.5" />
        {mutation.isPending ? 'Summarizing…' : 'Summarize'}
      </Button>

      {mutation.isError && (
        <p className="text-xs text-destructive">Failed to generate summary. Please try again.</p>
      )}

      {summary && (
        <div className="rounded-xl border border-border bg-muted/50 px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Summary
          </p>
          <p className={cn('text-sm text-foreground leading-relaxed', mutation.isPending && 'opacity-50')}>
            {summary}
          </p>
        </div>
      )}
    </div>
  )
}
