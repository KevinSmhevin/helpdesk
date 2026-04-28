import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { AxiosResponse } from 'axios'
import { TicketStatus, TicketCategory, TicketCategoryLabels } from '@helpdesk/core'
import TicketsPage from './TicketsPage'
import api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}))

const TICKETS = [
  {
    id: 'ticket-1',
    subject: 'Cannot log in to my account',
    fromEmail: 'alice@example.com',
    fromName: 'Alice Smith',
    status: TicketStatus.open,
    category: TicketCategory.technical_question,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'ticket-2',
    subject: 'Request a refund for order #42',
    fromEmail: 'bob@example.com',
    fromName: null,
    status: TicketStatus.resolved,
    category: TicketCategory.refund_request,
    createdAt: '2024-02-01T00:00:00Z',
  },
]

function mockGetTickets(tickets = TICKETS) {
  vi.mocked(api.get).mockResolvedValue({ data: tickets } as AxiosResponse)
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TicketsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketsPage', () => {
  describe('loading state', () => {
    it('shows skeleton rows while fetching', () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}) as ReturnType<typeof api.get>)
      renderPage()

      expect(screen.getByRole('columnheader', { name: 'Subject' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'From' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Received' })).toBeInTheDocument()
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('network error'))
      renderPage()

      await screen.findByText('Could not load tickets. Please try again.')
    })
  })

  describe('empty state', () => {
    it('shows empty message when no tickets are returned', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] } as AxiosResponse)
      renderPage()

      await screen.findByText('No tickets yet.')
    })
  })

  describe('ticket list', () => {
    beforeEach(() => mockGetTickets())

    it('renders a row for each ticket subject', async () => {
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(screen.getByText('Request a refund for order #42')).toBeInTheDocument()
    })

    it('shows fromName as the primary sender label when present', async () => {
      renderPage()

      await screen.findByText('Alice Smith')
    })

    it('shows fromEmail beneath fromName when a display name is present', async () => {
      renderPage()

      await screen.findByText('Alice Smith')
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    })

    it('shows only fromEmail when fromName is null', async () => {
      renderPage()

      await screen.findByText('bob@example.com')
      // "Bob" never appears in the DOM since fromName is null
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })

    it('renders status badges for each ticket', async () => {
      renderPage()

      await screen.findByText('open')
      expect(screen.getByText('resolved')).toBeInTheDocument()
    })

    it('renders the human-readable category label', async () => {
      renderPage()

      await screen.findByText(TicketCategoryLabels[TicketCategory.technical_question])
      expect(
        screen.getByText(TicketCategoryLabels[TicketCategory.refund_request])
      ).toBeInTheDocument()
    })

    it('renders an em-dash when category is null', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [{ ...TICKETS[0], category: null }],
      } as AxiosResponse)
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('renders a formatted received date for each ticket', async () => {
      renderPage()

      await screen.findByText(new Date('2024-03-01T00:00:00Z').toLocaleDateString())
      expect(
        screen.getByText(new Date('2024-02-01T00:00:00Z').toLocaleDateString())
      ).toBeInTheDocument()
    })

    it('calls GET /api/tickets', async () => {
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(api.get).toHaveBeenCalledWith('/api/tickets')
    })
  })
})
