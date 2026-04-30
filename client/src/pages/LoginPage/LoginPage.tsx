import { Navigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import LoginSkeleton from './LoginSkeleton'
import LoginForm from './LoginForm'

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <LoginSkeleton />
  if (session) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <LoginForm />
    </div>
  )
}
