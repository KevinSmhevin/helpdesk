import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { AxiosResponse } from 'axios'
import UsersPage from './UsersPage'
import api from '@/lib/api'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: vi.fn() },
}))

const ADMIN = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' }

const USERS = [
  { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'agent-1', name: 'Alice', email: 'alice@example.com', role: 'agent', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'agent-2', name: 'Bob',   email: 'bob@example.com',   role: 'agent', createdAt: '2024-03-01T00:00:00Z' },
]

const NEW_USER = { id: 'agent-3', name: 'Carol', email: 'carol@example.com', role: 'agent', createdAt: '2024-04-01T00:00:00Z' }

function mockGetUsers(users: typeof USERS | [] = USERS) {
  vi.mocked(api.get).mockResolvedValue({ data: users } as AxiosResponse)
}

async function openAddAgentForm() {
  await userEvent.click(screen.getByRole('button', { name: /add agent/i }))
}

async function fillAndSubmitForm(name: string, email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: /create agent/i }))
}

function renderPage(sessionUser = ADMIN) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: sessionUser },
    isPending: false,
  } as unknown as ReturnType<typeof authClient.useSession>)

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UsersPage', () => {
  describe('loading state', () => {
    it('shows skeleton rows while fetching', () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}) as ReturnType<typeof api.get>)
      renderPage()

      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('network error'))
      renderPage()

      await screen.findByText('Could not load users. Please try again.')
    })
  })

  describe('empty state', () => {
    it('shows empty message when no users returned', async () => {
      mockGetUsers([])
      renderPage()

      await screen.findByText('No users yet.')
    })
  })

  describe('user list', () => {
    beforeEach(() => mockGetUsers())

    it('renders a row for each user', async () => {
      renderPage()

      await screen.findByText('Admin')
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('shows email addresses', async () => {
      renderPage()

      await screen.findByText('alice@example.com')
      expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    })

    it('renders role badges for each user', async () => {
      renderPage()

      await screen.findByText('Admin')
      expect(screen.getAllByText(/^(admin|agent)$/)).toHaveLength(USERS.length)
    })

    it('hides the delete button for the logged-in user', async () => {
      renderPage()

      await screen.findByText('Admin')
      const rows = screen.getAllByRole('row').slice(1) // skip header row

      const adminRow = rows.find((r) => within(r).queryByText('Admin'))!
      expect(within(adminRow).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()

      const aliceRow = rows.find((r) => within(r).queryByText('Alice'))!
      expect(within(aliceRow).getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('removes a user from the list after deletion', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: {} } as AxiosResponse)
      renderPage()

      await screen.findByText('Alice')
      await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])

      await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
      expect(api.delete).toHaveBeenCalledWith('/api/users/agent-1')
    })
  })

  describe('create user form', () => {
    beforeEach(() => mockGetUsers([]))

    it('is collapsed by default', () => {
      renderPage()

      expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /create agent/i })).not.toBeInTheDocument()
    })

    it('expands when the toggle is clicked', async () => {
      renderPage()

      await openAddAgentForm()

      expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create agent/i })).toBeInTheDocument()
    })

    it('collapses again when the toggle is clicked a second time', async () => {
      renderPage()

      await openAddAgentForm()
      await userEvent.click(screen.getByRole('button', { name: /add agent/i }))

      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    })

    it('renders the add agent form fields when expanded', async () => {
      renderPage()

      await openAddAgentForm()

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create agent/i })).toBeInTheDocument()
    })

    it('adds the new user to the list on success', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Carol', 'carol@example.com', 'password123')

      await screen.findByText('Carol')
      expect(api.post).toHaveBeenCalledWith('/api/users', {
        name: 'Carol',
        email: 'carol@example.com',
        password: 'password123',
      })
    })

    it('collapses the form after successful creation', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Carol', 'carol@example.com', 'password123')

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      )
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    })

    it('clears the form after successful creation', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Carol', 'carol@example.com', 'password123')

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      )
      await openAddAgentForm()

      expect(screen.getByLabelText('Name')).toHaveValue('')
      expect(screen.getByLabelText('Email')).toHaveValue('')
      expect(screen.getByLabelText('Password')).toHaveValue('')
    })

    it('shows an error when name is shorter than 3 characters', async () => {
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Jo', 'jo@example.com', 'password123')

      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('shows an error when password is shorter than 8 characters', async () => {
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Jane Smith', 'jane@example.com', 'short')

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('shows server error message on failed creation', async () => {
      vi.mocked(api.post).mockRejectedValue({ response: { data: { error: 'A user with that email already exists' } } })
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Carol', 'carol@example.com', 'password123')

      await screen.findByText('A user with that email already exists')
    })

    it('shows fallback error message when server provides none', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('network error'))
      renderPage()

      await openAddAgentForm()
      await fillAndSubmitForm('Carol', 'carol@example.com', 'password123')

      await screen.findByText('Failed to create user')
    })
  })
})
