import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateUserSchema } from '@helpdesk/core'
import type { CreateUserInput } from '@helpdesk/core'

type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent'
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()

  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users').then((r) => r.data),
  })

  const createUser = useMutation({
    mutationFn: (body: CreateUserInput) => api.post<User>('/api/users', body).then((r) => r.data),
    onSuccess: (newUser) => {
      queryClient.setQueryData<User[]>(['users'], (prev = []) => [newUser, ...prev])
      form.reset()
      setIsOpen(false)
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create user'
      form.setError('root', { message })
    },
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<User[]>(['users'], (prev = []) => prev.filter((u) => u.id !== id))
    },
  })

  function onSubmit(data: CreateUserInput) {
    createUser.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>

      {/* Create user form */}
      <section className="border border-border rounded-xl bg-background">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="add-agent-form"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-6 py-4 text-base font-medium text-foreground"
        >
          Add agent
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div id="add-agent-form" className="px-6 pb-6">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              autoComplete="off"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  {...form.register('name')}
                  id="name"
                  autoComplete="off"
                  placeholder="Jane Smith"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...form.register('email')}
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="jane@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...form.register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              {form.formState.errors.root && (
                <p className="sm:col-span-3 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <div className="sm:col-span-3">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || createUser.isPending}
                >
                  {createUser.isPending ? 'Creating…' : 'Create agent'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* User list */}
      <section>
        {isLoading ? (
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
        ) : isError ? (
          <p className="text-sm text-destructive">Could not load users. Please try again.</p>
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
                          disabled={deleteUser.isPending && deleteUser.variables === user.id}
                          onClick={() => deleteUser.mutate(user.id)}
                        >
                          {deleteUser.isPending && deleteUser.variables === user.id
                            ? 'Deleting…'
                            : 'Delete'}
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
