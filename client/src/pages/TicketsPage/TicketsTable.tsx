import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import type { SortingState, OnChangeFn } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import { statusStyles } from '@/lib/ticket'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TicketsTableSkeleton from './TicketsTableSkeleton'
import type { Ticket } from './TicketsPage'

type Props = {
  tickets: Ticket[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  isLoading: boolean
  isError: boolean
  hasActiveFilters: boolean
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
  columnHelper.accessor('assignedTo', {
    header: 'Assigned to',
    cell: (info) => {
      const agent = info.getValue()
      return (
        <span className="text-muted-foreground">{agent ? agent.name : '—'}</span>
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

export default function TicketsTable({
  tickets,
  sorting,
  onSortingChange,
  isLoading,
  isError,
  hasActiveFilters,
}: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <TicketsTableSkeleton />

  if (isError) return (
    <p className="text-sm text-destructive">Could not load tickets. Please try again.</p>
  )

  if (tickets.length === 0) return (
    <p className="text-sm text-muted-foreground">
      {hasActiveFilters ? 'No tickets match your filters.' : 'No tickets yet.'}
    </p>
  )

  return (
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
  )
}

