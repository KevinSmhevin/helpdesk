import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { AxiosResponse } from 'axios'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import TicketDetailPage from './TicketDetailPage'
import api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useParams: () => ({ id: 'ticket-1' }) }
})

// base-ui Select doesn't open its popup in jsdom — replace with a minimal
// implementation that routes onValueChange through a React context so
// SelectItem clicks propagate correctly.
vi.mock('@/components/ui/select', async () => {
  const React = await import('react')
  type OnChange = (v: string) => void
  const Ctx = React.createContext<OnChange | undefined>(undefined)

  return {
    Select: ({ onValueChange, disabled, children }: {
      value?: string; onValueChange?: OnChange; disabled?: boolean; children?: React.ReactNode
    }) => React.createElement(Ctx.Provider, { value: onValueChange },
      React.createElement('div', { 'aria-disabled': disabled ?? false }, children)
    ),
    SelectTrigger: ({ children, className }: { children?: React.ReactNode; className?: string }) =>
      React.createElement('button', { role: 'combobox', type: 'button', className }, children),
    SelectValue: () => null,
    SelectContent: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', null, children),
    SelectItem: ({ value, children }: { value: string; children?: React.ReactNode }) => {
      const onChange = React.useContext(Ctx)
      return React.createElement('button', { role: 'option', type: 'button', onClick: () => onChange?.(value) }, children)
    },
  }
})

const AGENTS = [
  { id: 'agent-1', name: 'Bob Agent', email: 'bob@example.com' },
  { id: 'agent-2', name: 'Carol Agent', email: 'carol@example.com' },
]

type TicketDetail = {
  id: string
  subject: string
  body: string
  fromEmail: string
  fromName: string | null
  toEmail: string
  status: TicketStatus
  category: TicketCategory | null
  messageId: string
  inReplyTo: string | null
  assignedTo: typeof AGENTS[number] | null
  createdAt: string
  updatedAt: string
}

const TICKET: TicketDetail = {
  id: 'ticket-1',
  subject: 'Cannot log in to my account',
  body: 'I have been unable to log in for two days.',
  fromEmail: 'alice@example.com',
  fromName: 'Alice Smith',
  toEmail: 'support@helpdesk.com',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  messageId: '<msg-1@example.com>',
  inReplyTo: null,
  assignedTo: null,
  createdAt: '2024-03-01T10:00:00Z',
  updatedAt: '2024-03-01T10:00:00Z',
}

function mockGet(ticket = TICKET, agents = AGENTS) {
  vi.mocked(api.get).mockImplementation((url) => {
    if ((url as string).startsWith('/api/tickets/'))
      return Promise.resolve({ data: ticket } as AxiosResponse)
    if (url === '/api/agents')
      return Promise.resolve({ data: agents } as AxiosResponse)
    return Promise.reject(new Error(`unexpected url: ${url}`))
  })
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TicketDetailPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketDetailPage', () => {
  describe('loading state', () => {
    it('shows skeleton while fetching', () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}) as ReturnType<typeof api.get>)
      renderPage()

      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('shows error message when ticket fetch fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('network error'))
      renderPage()

      await screen.findByText('Could not load ticket. Please try again.')
    })
  })

  describe('ticket details', () => {
    beforeEach(() => mockGet())

    it('renders the ticket subject as a heading', async () => {
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
    })

    it('renders the status badge', async () => {
      renderPage()

      await screen.findByText('open')
    })

    it('renders the human-readable category label', async () => {
      renderPage()

      await screen.findByText(TicketCategoryLabels[TicketCategory.technical_question])
    })

    it('renders from name and email', async () => {
      renderPage()

      await screen.findByText('Alice Smith')
      expect(screen.getByText('alice@example.com', { exact: false })).toBeInTheDocument()
    })

    it('renders the to email', async () => {
      renderPage()

      await screen.findByText('support@helpdesk.com')
    })

    it('renders the message body', async () => {
      renderPage()

      await screen.findByText('I have been unable to log in for two days.')
    })

    it('renders a back link to /tickets', async () => {
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      expect(screen.getByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets')
    })
  })

  describe('assignment select', () => {
    it('shows "Unassigned" in the trigger when no agent is assigned', async () => {
      mockGet({ ...TICKET, assignedTo: null })
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      expect(within(screen.getByRole('combobox')).getByText('Unassigned')).toBeInTheDocument()
    })

    it('shows the assigned agent name in the trigger when a ticket is already assigned', async () => {
      mockGet({ ...TICKET, assignedTo: AGENTS[0] })
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      expect(within(screen.getByRole('combobox')).getByText('Bob Agent')).toBeInTheDocument()
    })

    it('renders all agents as options', async () => {
      mockGet()
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Bob Agent' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Carol Agent' })).toBeInTheDocument()
    })

    it('calls PATCH with the agent id when an agent is selected', async () => {
      mockGet()
      vi.mocked(api.patch).mockResolvedValue({ data: { ...TICKET, assignedTo: AGENTS[0] } } as AxiosResponse)
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      await userEvent.click(screen.getByRole('option', { name: 'Bob Agent' }))

      await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith('/api/tickets/ticket-1', { assignedToId: 'agent-1' })
      )
    })

    it('calls PATCH with null when Unassigned is selected', async () => {
      mockGet({ ...TICKET, assignedTo: AGENTS[0] })
      vi.mocked(api.patch).mockResolvedValue({ data: { ...TICKET, assignedTo: null } } as AxiosResponse)
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      await userEvent.click(screen.getByRole('option', { name: 'Unassigned' }))

      await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith('/api/tickets/ticket-1', { assignedToId: null })
      )
    })

    it('updates the trigger label after successful assignment', async () => {
      mockGet()
      vi.mocked(api.patch).mockResolvedValue({ data: { ...TICKET, assignedTo: AGENTS[0] } } as AxiosResponse)
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      await userEvent.click(screen.getByRole('option', { name: 'Bob Agent' }))

      await waitFor(() =>
        expect(within(screen.getByRole('combobox')).getByText('Bob Agent')).toBeInTheDocument()
      )
    })

    it('shows an error message when the PATCH request fails', async () => {
      mockGet()
      vi.mocked(api.patch).mockRejectedValue(new Error('network error'))
      renderPage()

      await screen.findByRole('heading', { name: 'Cannot log in to my account' })
      await userEvent.click(screen.getByRole('option', { name: 'Bob Agent' }))

      await screen.findByText('Failed to update assignee.')
    })
  })
})
