import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function BackToTickets() {
  return (
    <div>
      <Link
        to="/tickets"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 text-muted-foreground')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to tickets
      </Link>
    </div>
  )
}
