import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function TicketsTableSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Subject</TableHead>
            <TableHead className="px-4">From</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Assigned to</TableHead>
            <TableHead className="px-4">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4"><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
