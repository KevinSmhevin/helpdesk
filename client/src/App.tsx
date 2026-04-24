import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { authClient } from './lib/auth-client'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'

function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return null
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return null
  if (!session) return <Navigate to="/login" replace />
  if ((session.user as { role?: string }).role !== 'admin') return <Navigate to="/" replace />
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
