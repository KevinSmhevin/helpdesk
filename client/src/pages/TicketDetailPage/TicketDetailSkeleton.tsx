import { Skeleton } from '@/components/ui/skeleton'

export default function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <div className="border border-border rounded-xl p-5 grid grid-cols-2 gap-x-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="border border-border rounded-xl p-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="border border-border rounded-xl p-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
