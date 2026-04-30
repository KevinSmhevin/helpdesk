import { useEffect, useState } from 'react'
import ServerStatusSkeleton from './ServerStatusSkeleton'

export default function ServerStatus() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading') return <ServerStatusSkeleton />

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm">
      {status === 'ok' ? (
        <>
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-gray-600">Server is up and running</span>
        </>
      ) : (
        <>
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-red-600">Could not reach server</span>
        </>
      )}
    </div>
  )
}
