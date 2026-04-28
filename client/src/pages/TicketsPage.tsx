import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import api from '@/lib/api'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
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

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.open]: 'bg-primary/10 text-primary',
  [TicketStatus.resolved]: 'bg-green-100 text-green-700',
  [TicketStatus.closed]: 'bg-muted text-muted-foreground',
}

const columnHelper = createColumnHelper<Ticket>()

const columns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => (
      <span className="font-medium text-foreground max-w-xs truncate block">
        {info.getValue()}
      </span>
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
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])

  const { data: tickets = [], isLoading, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets', sorting],
    queryFn: async () => {
      const sort = sorting[0]
      const params = sort
        ? `?sortBy=${sort.id}&sortOrder=${sort.desc ? 'desc' : 'asc'}`
        : ''
      const res = await api.get<Ticket[]>(`/api/tickets${params}`)
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
      {isLoading ? (
        <TicketsTableSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load tickets. Please try again.</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
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
