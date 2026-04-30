import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UsersTableSkeleton from './UsersTableSkeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Role } from '@helpdesk/core'
import EditUserDialog from './EditUserDialog'
import type { User } from './UsersPage'

type Props = {
  users: User[]
  isLoading: boolean
  isError: boolean
}

const COLUMNS = ['Name', 'Email', 'Role', 'Created', '']

export default function UsersTable({ users, isLoading, isError }: Props) {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<User[]>(['users'], (prev = []) => prev.filter((u) => u.id !== id))
    },
  })

  if (isLoading) return <UsersTableSkeleton />

  if (isError) {
    return <p className="text-sm text-destructive">Could not load users. Please try again.</p>
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>
  }

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col} className="px-4">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-4 font-medium text-foreground">{user.name}</TableCell>
                <TableCell className="px-4 text-muted-foreground">{user.email}</TableCell>
                <TableCell className="px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === Role.admin
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditingUser(user)}
                      aria-label={`Edit ${user.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {user.role !== Role.admin && (
                      <Button
                        variant="destructive"
                        size="xs"
                        disabled={deleteUser.isPending && deleteUser.variables === user.id}
                        onClick={() => setDeletingUser(user)}
                      >
                        {deleteUser.isPending && deleteUser.variables === user.id
                          ? 'Deleting…'
                          : 'Delete'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />

      <AlertDialog
        open={deletingUser !== null}
        onOpenChange={(open) => { if (!open) setDeletingUser(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate their account. This action cannot be undone from the UI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteUser.mutate(deletingUser!.id)
                setDeletingUser(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
