import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketSortColumn, SortOrder, type Ticket } from '@helpdesk/core'
import TicketsFilters from './TicketsFilters'
import TicketsTable from './TicketsTable'
import TicketsPagination from './TicketsPagination'

type TicketsResponse = {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: TicketSortColumn.createdAt, desc: true }])
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | 'all'>('all')
  const [category, setCategory] = useState<TicketCategory | 'all'>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [sorting, status, category, debouncedSearch])

  const hasActiveFilters = debouncedSearch !== '' || status !== 'all' || category !== 'all'

  const { data, isLoading, isError } = useQuery<TicketsResponse>({
    queryKey: ['tickets', sorting, status, category, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      const sort = sorting[0]
      if (sort) {
        params.set('sortBy', sort.id)
        params.set('sortOrder', sort.desc ? SortOrder.desc : SortOrder.asc)
      }
      if (status !== 'all') params.set('status', status)
      if (category !== 'all') params.set('category', category)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(page))
      const res = await api.get<TicketsResponse>(`/api/tickets?${params.toString()}`)
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  const tickets = data?.tickets ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const pageSize = data?.pageSize ?? 10
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function clearFilters() {
    setSearchInput('')
    setStatus('all')
    setCategory('all')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>

      <TicketsFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      <TicketsTable
        tickets={tickets}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        isError={isError}
        hasActiveFilters={hasActiveFilters}
      />

      <TicketsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  )
}
