import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <span className="font-semibold text-gray-800">Helpdesk</span>
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
