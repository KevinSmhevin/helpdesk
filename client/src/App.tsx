import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
