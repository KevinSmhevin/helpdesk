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
    <div className="p-4">
      {status === 'loading' && <p>Checking server...</p>}
      {status === 'ok' && <p>Server is up and running</p>}
      {status === 'error' && <p>Could not reach server</p>}
    </div>
  )
}
