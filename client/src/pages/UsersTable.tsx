import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EditUserDialog from './EditUserDialog'
import type { User } from './UsersPage'

type Props = {
  users: User[]
  isLoading: boolean
  isError: boolean
}

export default function UsersTable({ users, isLoading, isError }: Props) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<User[]>(['users'], (prev = []) => prev.filter((u) => u.id !== id))
    },
  })

  if (isLoading) {
    return (
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
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">Could not load users. Please try again.</p>
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>
  }

  return (
    <>
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
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditingUser(user)}
                    aria-label={`Edit ${user.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  {user.id !== session?.user.id && (
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={deleteUser.isPending && deleteUser.variables === user.id}
                      onClick={() => deleteUser.mutate(user.id)}
                    >
                      {deleteUser.isPending && deleteUser.variables === user.id
                        ? 'Deleting…'
                        : 'Delete'}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
    </>
  )
}
