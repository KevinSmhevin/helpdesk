import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { SenderType } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

type Reply = {
  id: string
  body: string
  senderType: SenderType
  userId: string | null
  user: { id: string; name: string; email: string } | null
  createdAt: string
}

export default function TicketReplyThread({
  ticketId,
  fromName,
  fromEmail,
}: {
  ticketId: string
  fromName: string | null
  fromEmail: string
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const { data: replies = [], isLoading } = useQuery<Reply[]>({
    queryKey: ['ticket-replies', ticketId],
    queryFn: () => api.get<Reply[]>(`/api/tickets/${ticketId}/replies`).then((r) => r.data),
  })

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<Reply>(`/api/tickets/${ticketId}/replies`, { body }).then((r) => r.data),
    onSuccess: (newReply) => {
      queryClient.setQueryData<Reply[]>(['ticket-replies', ticketId], (prev = []) => [...prev, newReply])
      setDraft('')
    },
  })

  const polishMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<{ body: string }>(`/api/tickets/${ticketId}/polish`, { body }).then((r) => r.data),
    onSuccess: (result) => {
      setDraft(result.body)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    replyMutation.mutate(body)
  }

  function handlePolish() {
    const body = draft.trim()
    if (!body) return
    polishMutation.mutate(body)
  }

  const isBusy = replyMutation.isPending || polishMutation.isPending

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Thread
        </h2>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : replies.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">No replies yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {replies.map((reply) => (
            <li key={reply.id} className="px-5 py-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">
                  {reply.senderType === SenderType.agent
                    ? (reply.user?.name ?? reply.user?.email ?? 'Agent')
                    : fromName ?? fromEmail}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
                <span
                  className={cn(
                    'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                    reply.senderType === SenderType.agent
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {reply.senderType === SenderType.agent ? 'Agent' : 'Customer'}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {reply.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="border-t border-border p-5 space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a reply…"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          disabled={isBusy}
        />
        {replyMutation.isError && (
          <p className="text-xs text-destructive">Failed to send reply. Please try again.</p>
        )}
        {polishMutation.isError && (
          <p className="text-xs text-destructive">Failed to polish reply. Please try again.</p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy || !draft.trim()}
            onClick={handlePolish}
          >
            <Sparkles className="size-3.5" />
            {polishMutation.isPending ? 'Polishing…' : 'Polish'}
          </Button>
          <Button type="submit" disabled={isBusy} size="sm">
            {replyMutation.isPending ? 'Sending…' : 'Send reply'}
          </Button>
        </div>
      </form>
    </div>
  )
}
