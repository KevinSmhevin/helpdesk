import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreateUserSchema } from '@helpdesk/core'
import type { CreateUserInput } from '@helpdesk/core'
import type { User } from './UsersPage'

export default function AddAgentForm() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { name: '', email: '', password: '' },
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

  function onSubmit(data: CreateUserInput) {
    createUser.mutate(data)
  }

  return (
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
              <Button type="submit" disabled={form.formState.isSubmitting || createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create agent'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
