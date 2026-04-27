import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { AxiosResponse } from 'axios'
import AddAgentForm from './AddAgentForm'
import api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  default: { post: vi.fn() },
}))

const NEW_USER = {
  id: 'agent-1',
  name: 'Carol',
  email: 'carol@example.com',
  role: 'agent',
  createdAt: '2024-04-01T00:00:00Z',
}

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AddAgentForm />
    </QueryClientProvider>
  )
}

async function openForm() {
  await userEvent.click(screen.getByRole('button', { name: /add agent/i }))
}

async function fillAndSubmit(name: string, email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: /create agent/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AddAgentForm', () => {
  describe('toggle', () => {
    it('is collapsed by default', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    })

    it('reveals the form when the header is clicked', async () => {
      renderForm()

      await openForm()

      expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create agent/i })).toBeInTheDocument()
    })

    it('collapses when the header is clicked again', async () => {
      renderForm()

      await openForm()
      await userEvent.click(screen.getByRole('button', { name: /add agent/i }))

      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    })
  })

  describe('validation', () => {
    beforeEach(async () => {
      renderForm()
      await openForm()
    })

    it('blocks submission and shows error when name is shorter than 3 characters', async () => {
      await fillAndSubmit('Jo', 'jo@example.com', 'password123')

      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('blocks submission and shows error when password is shorter than 8 characters', async () => {
      await fillAndSubmit('Jane Smith', 'jane@example.com', 'short')

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('blocks submission and shows error for an invalid email address', async () => {
      await fillAndSubmit('Jane Smith', 'not-an-email', 'password123')

      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('calls the API with the correct payload', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      expect(api.post).toHaveBeenCalledWith('/api/users', {
        name: 'Carol',
        email: 'carol@example.com',
        password: 'password123',
      })
    })

    it('collapses the form after the user is created', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      )
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    })

    it('resets all fields after the user is created', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: NEW_USER } as AxiosResponse)
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'false')
      )
      await openForm()

      expect(screen.getByLabelText('Name')).toHaveValue('')
      expect(screen.getByLabelText('Email')).toHaveValue('')
      expect(screen.getByLabelText('Password')).toHaveValue('')
    })

    it('disables the submit button while the request is in flight', async () => {
      vi.mocked(api.post).mockReturnValue(new Promise(() => {}) as ReturnType<typeof api.post>)
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })
  })

  describe('failed submission', () => {
    it('shows the error message returned by the server', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { error: 'A user with that email already exists' } },
      })
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      await screen.findByText('A user with that email already exists')
    })

    it('shows a fallback error when the server returns no message', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('network error'))
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      await screen.findByText('Failed to create user')
    })

    it('keeps the form open so the user can correct their input', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { error: 'A user with that email already exists' } },
      })
      renderForm()

      await openForm()
      await fillAndSubmit('Carol', 'carol@example.com', 'password123')

      await screen.findByText('A user with that email already exists')
      expect(screen.getByRole('button', { name: /add agent/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
    })
  })
})
