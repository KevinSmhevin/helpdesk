import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLUMNS = ['Name', 'Email', 'Role', 'Created', '']

export default function UsersTableSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col} className="px-4">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
              <TableCell className="px-4"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="px-4" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
