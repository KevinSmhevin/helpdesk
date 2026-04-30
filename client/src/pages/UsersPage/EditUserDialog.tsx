import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UpdateUserSchema } from '@helpdesk/core'
import type { UpdateUserInput } from '@helpdesk/core'
import type { User } from './UsersPage'

type Props = {
  user: User | null
  onClose: () => void
}

export default function EditUserDialog({ user, onClose }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name, email: user.email, password: '' })
    }
  }, [user, form])

  const updateUser = useMutation({
    mutationFn: (body: UpdateUserInput) =>
      api.put<User>(`/api/users/${user!.id}`, body).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(['users'], (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      )
      onClose()
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update user'
      form.setError('root', { message })
    },
  })

  function onSubmit(data: UpdateUserInput) {
    updateUser.mutate(data)
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit agent</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              {...form.register('name')}
              id="edit-name"
              autoComplete="off"
              placeholder="Jane Smith"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              {...form.register('email')}
              id="edit-email"
              type="email"
              autoComplete="off"
              placeholder="jane@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-password">New password</Label>
            <Input
              {...form.register('password')}
              id="edit-password"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || updateUser.isPending}>
              {updateUser.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
