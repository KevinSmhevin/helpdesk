import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels, TicketSortColumn, SortOrder } from '@helpdesk/core'
import { statusStyles } from '@/lib/ticket'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Ticket = {
  id: string
  subject: string
  fromEmail: string
  fromName: string | null
  status: TicketStatus
  category: TicketCategory | null
  createdAt: string
}

type TicketsResponse = {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const columnHelper = createColumnHelper<Ticket>()

const columns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="text-foreground max-w-xs truncate block hover:text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('fromEmail', {
    header: 'From',
    cell: (info) => {
      const { fromName, fromEmail } = info.row.original
      return (
        <div className="text-muted-foreground">
          <div>{fromName ?? fromEmail}</div>
          {fromName && <div className="text-xs text-muted-foreground/70">{fromEmail}</div>}
        </div>
      )
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
        >
          {status}
        </span>
      )
    },
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => {
      const category = info.getValue()
      return (
        <span className="text-muted-foreground">
          {category ? TicketCategoryLabels[category] : '—'}
        </span>
      )
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Received',
    cell: (info) => (
      <span className="text-muted-foreground">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
]

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

  // Reset to page 1 whenever sort or filters change
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

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  })

  function clearFilters() {
    setSearchInput('')
    setStatus('all')
    setCategory('all')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tickets…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus | 'all')}>
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
            onValueChange={(v) => setCategory(v as TicketCategory | 'all')}
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <TicketsTableSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load tickets. Please try again.</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters ? 'No tickets match your filters.' : 'No tickets yet.'}
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        className="px-4 cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {from}–{to} of {total}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TicketsTableSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Subject</TableHead>
            <TableHead className="px-4">From</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
