import type { DashboardData } from '@helpdesk/core'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

type Props = { ticketsPerDay: DashboardData['ticketsPerDay'] }

export default function TicketsBarChart({ ticketsPerDay }: Props) {
  const data = ticketsPerDay.map((d) => ({ ...d, label: formatDateLabel(d.date) }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Tickets per Day — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              interval={4}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value: number) => [value, 'Tickets']}
            />
            <Bar dataKey="count" fill="var(--foreground)" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function TicketsBarChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  )
}
