import { useEffect, useState } from 'react'

export default function HomePage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm">
        {status === 'loading' && (
          <>
            <span className="size-2 rounded-full bg-gray-300 animate-pulse" />
            <span className="text-gray-500">Checking server…</span>
          </>
        )}
        {status === 'ok' && (
          <>
            <span className="size-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Server is up and running</span>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-red-600">Could not reach server</span>
          </>
        )}
      </div>
    </div>
  )
}
