import { Link, useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin'

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-semibold text-foreground hover:text-foreground/80 transition-colors">
          Helpdesk
        </Link>
        {isAdmin && (
          <Link to="/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
