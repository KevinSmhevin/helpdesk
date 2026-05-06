export type DashboardData = {
  totalTickets: number
  openTickets: number
  resolvedByAI: number
  resolvedByAIPercent: number
  avgResolutionTimeHours: number | null
  ticketsPerDay: Array<{ date: string; count: number }>
}
