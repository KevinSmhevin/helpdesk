import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardData } from '@helpdesk/core'
import DashboardMetrics from './DashboardMetrics'
import DashboardMetricsSkeleton from './DashboardMetricsSkeleton'
import TicketsBarChart, { TicketsBarChartSkeleton } from './TicketsBarChart'

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/dashboard').then((r) => r.data),
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>

      <div className="space-y-6">
        {isLoading && (
          <>
            <DashboardMetricsSkeleton />
            <TicketsBarChartSkeleton />
          </>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load dashboard data.</p>
        )}

        {data && (
          <>
            <DashboardMetrics data={data} />
            <TicketsBarChart ticketsPerDay={data.ticketsPerDay} />
          </>
        )}
      </div>
    </div>
  )
}
