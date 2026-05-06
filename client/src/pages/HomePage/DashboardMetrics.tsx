import type { DashboardData } from '@helpdesk/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, CheckCircle, Clock, Percent } from 'lucide-react'

function formatHours(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${hours.toFixed(1)}h`
}

type MetricCardProps = {
  title: string
  value: string
  icon: React.ReactNode
  description?: string
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function DashboardMetrics({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard
        title="Total Tickets"
        value={data.totalTickets.toLocaleString()}
        icon={<Ticket size={16} />}
      />
      <MetricCard
        title="Open Tickets"
        value={data.openTickets.toLocaleString()}
        icon={<Ticket size={16} />}
        description="Awaiting agent response"
      />
      <MetricCard
        title="Resolved by AI"
        value={data.resolvedByAI.toLocaleString()}
        icon={<CheckCircle size={16} />}
        description={`${data.resolvedByAIPercent.toFixed(1)}% of all tickets`}
      />
      <MetricCard
        title="AI Resolution %"
        value={`${data.resolvedByAIPercent.toFixed(1)}%`}
        icon={<Percent size={16} />}
        description={
          data.avgResolutionTimeHours !== null
            ? `Avg resolved in ${formatHours(data.avgResolutionTimeHours)}`
            : 'No resolved tickets yet'
        }
      />
    </div>
  )
}
