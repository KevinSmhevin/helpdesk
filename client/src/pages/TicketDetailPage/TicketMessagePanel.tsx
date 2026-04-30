export default function TicketMessagePanel({ body }: { body: string }) {
  return (
    <div className="border border-border rounded-xl p-5 space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Message
      </h2>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {body}
      </p>
    </div>
  )
}
