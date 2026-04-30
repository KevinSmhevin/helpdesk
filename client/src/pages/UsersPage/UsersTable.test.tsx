import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { AxiosResponse } from 'axios'
import { Role } from '@helpdesk/core'
import UsersTable from './UsersTable'
import { authClient } from '@/lib/auth-client'
import api from '@/lib/api'
import type { User } from './UsersPage'

vi.mock('@/lib/api', () => ({
  default: { delete: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: vi.fn() },
}))

const ADMIN: User = {
  id: 'admin-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: Role.admin,
  createdAt: '2024-01-01T00:00:00Z',
}

const AGENT: User = {
  id: 'agent-1',
  name: 'Bob',
  email: 'bob@example.com',
  role: Role.agent,
  createdAt: '2024-02-01T00:00:00Z',
}

function mockSession(userId: string) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { id: userId } },
  } as unknown as ReturnType<typeof authClient.useSession>)
}

function renderTable(props: { users: User[]; isLoading: boolean; isError: boolean }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersTable {...props} />
    </QueryClientProvider>
  )
}

async function clickDeleteRow() {
  await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
}

async function confirmDeleteDialog() {
  const dialog = screen.getByRole('alertdialog')
  await userEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession(ADMIN.id)
})

describe('UsersTable', () => {
  describe('loading state', () => {
    it('renders skeleton rows while loading', () => {
      renderTable({ users: [], isLoading: true, isError: false })

      const skeletons = document.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
      expect(screen.queryByText(ADMIN.name)).not.toBeInTheDocument()
    })

    it('renders the table header while loading', () => {
      renderTable({ users: [], isLoading: true, isError: false })

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows an error message when the query fails', () => {
      renderTable({ users: [], isLoading: false, isError: true })

      expect(screen.getByText('Could not load users. Please try again.')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows an empty message when there are no users', () => {
      renderTable({ users: [], isLoading: false, isError: false })

      expect(screen.getByText('No users yet.')).toBeInTheDocument()
    })
  })

  describe('user list', () => {
    it('renders a row for each user', () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      expect(screen.getByText(ADMIN.name)).toBeInTheDocument()
      expect(screen.getByText(AGENT.name)).toBeInTheDocument()
    })

    it('renders each user email', () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      expect(screen.getByText(ADMIN.email)).toBeInTheDocument()
      expect(screen.getByText(AGENT.email)).toBeInTheDocument()
    })

    it('renders role badges for each user', () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('agent')).toBeInTheDocument()
    })

    it('renders a formatted creation date', () => {
      renderTable({ users: [ADMIN], isLoading: false, isError: false })

      const formattedDate = new Date(ADMIN.createdAt).toLocaleDateString()
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })
  })

  describe('access control', () => {
    it('hides the delete button for admin users', () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
      expect(deleteButtons).toHaveLength(1)
    })

    it('shows a delete button for agent users', () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
    })
  })

  describe('confirmation dialog', () => {
    it('shows a confirmation dialog with the user name when delete is clicked', async () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      await clickDeleteRow()

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(`Delete ${AGENT.name}?`)).toBeInTheDocument()
    })

    it('closes the dialog without deleting when cancel is clicked', async () => {
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      await clickDeleteRow()
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(api.delete).not.toHaveBeenCalled()
    })
  })

  describe('delete mutation', () => {
    it('calls the API with the correct user id after confirmation', async () => {
      vi.mocked(api.delete).mockResolvedValue({} as AxiosResponse)
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      await clickDeleteRow()
      await confirmDeleteDialog()

      expect(api.delete).toHaveBeenCalledWith(`/api/users/${AGENT.id}`)
    })

    it('removes the deleted user from the list on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({} as AxiosResponse)
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      queryClient.setQueryData<User[]>(['users'], [ADMIN, AGENT])

      render(
        <QueryClientProvider client={queryClient}>
          <UsersTable users={[ADMIN, AGENT]} isLoading={false} isError={false} />
        </QueryClientProvider>
      )

      await clickDeleteRow()
      await confirmDeleteDialog()

      await waitFor(() => {
        expect(queryClient.getQueryData<User[]>(['users'])).toEqual([ADMIN])
      })
    })

    it('shows "Deleting…" and disables the button while the request is in flight', async () => {
      vi.mocked(api.delete).mockReturnValue(new Promise(() => {}) as ReturnType<typeof api.delete>)
      renderTable({ users: [ADMIN, AGENT], isLoading: false, isError: false })

      await clickDeleteRow()
      await confirmDeleteDialog()

      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled()
    })
  })
})
