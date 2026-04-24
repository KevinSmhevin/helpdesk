import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  createdAt: string
}

type FormState = { name: string; email: string; password: string }

export default function UsersPage() {
  const { data: session } = authClient.useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load users')
      setUsers(await res.json())
    } catch {
      setFetchError('Could not load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? 'Failed to create user')
        return
      }
      setUsers((prev) => [data, ...prev])
      setForm({ name: '', email: '', password: '' })
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Failed to delete user')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>

      {/* Create user form */}
      <section className="border border-border rounded-xl p-6 bg-background space-y-4">
        <h2 className="text-base font-medium text-foreground">Add agent</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {formError && (
            <p className="sm:col-span-3 text-sm text-destructive">{formError}</p>
          )}
          <div className="sm:col-span-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create agent'}
            </Button>
          </div>
        </form>
      </section>

      {/* User list */}
      <section>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : fetchError ? (
          <p className="text-sm text-destructive">{fetchError}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== session?.user.id && (
                        <Button
                          variant="destructive"
                          size="xs"
                          disabled={deletingId === user.id}
                          onClick={() => handleDelete(user.id)}
                        >
                          {deletingId === user.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
