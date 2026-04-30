import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { RoleType } from '@helpdesk/core'
import AddAgentForm from './AddAgentForm'
import UsersTable from './UsersTable'

export type User = {
  id: string
  name: string
  email: string
  role: RoleType
  createdAt: string
}

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users').then((r) => r.data),
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>
      <AddAgentForm />
      <section>
        <UsersTable users={users} isLoading={isLoading} isError={isError} />
      </section>
    </div>
  )
}
