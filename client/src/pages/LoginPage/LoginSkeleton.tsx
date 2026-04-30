import { Skeleton } from '@/components/ui/skeleton'

export default function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-border p-6 bg-background space-y-5">
        <Skeleton className="h-6 w-44" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}
