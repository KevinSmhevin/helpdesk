import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { authClient } from './lib/auth-client'
import { Role } from '@helpdesk/core'
import { Skeleton } from '@/components/ui/skeleton'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TicketsPage from './pages/TicketsPage'
import UsersPage from './pages/UsersPage'

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return <PageSkeleton />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return <PageSkeleton />
  if (!session) return <Navigate to="/login" replace />
  if ((session.user as { role?: Role }).role !== Role.admin) return <Navigate to="/" replace />
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
