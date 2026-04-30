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
    assignedTo: { id: 'agent-1', name: 'Bob Agent', email: 'bob@example.com' },
  },
  {
    id: 'ticket-2',
    subject: 'Request a refund for order #42',
    fromEmail: 'bob@example.com',
    fromName: null,
    status: TicketStatus.resolved,
    category: TicketCategory.refund_request,
    createdAt: '2024-02-01T00:00:00Z',
    assignedTo: null,
  },
]

function mockGetTickets(tickets = TICKETS, overrides: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { tickets, total: tickets.length, page: 1, pageSize: 10, totalPages: 1, ...overrides },
  } as AxiosResponse)
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
      expect(screen.getByRole('columnheader', { name: 'Assigned to' })).toBeInTheDocument()
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
      vi.mocked(api.get).mockResolvedValue({
        data: { tickets: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      } as AxiosResponse)
      renderPage()

      await screen.findByText('No tickets yet.')
    })
  })

  describe('filter bar', () => {
    beforeEach(() => mockGetTickets())

    it('renders search input and two filter selects', async () => {
      renderPage()

      expect(screen.getByPlaceholderText('Search tickets…')).toBeInTheDocument()
      expect(screen.getAllByRole('combobox')).toHaveLength(2)
    })

    it('does not show Clear button before any filter is applied', async () => {
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('shows "Showing X–Y of Z" when results are returned', async () => {
      mockGetTickets(TICKETS, { total: 2, page: 1, pageSize: 10, totalPages: 1 })
      renderPage()

      await screen.findByText('Showing 1–2 of 2')
    })

    it('does not show pagination controls when all results fit on one page', async () => {
      mockGetTickets(TICKETS, { total: 2, totalPages: 1 })
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })

    it('shows Previous and Next buttons when there are multiple pages', async () => {
      mockGetTickets(TICKETS, { total: 101, page: 2, pageSize: 10, totalPages: 11 })
      renderPage()

      await screen.findByRole('button', { name: /previous/i })
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByText(/page 1 of 11/i)).toBeInTheDocument()
    })

    it('disables Previous on the first page', async () => {
      mockGetTickets(TICKETS, { total: 101, page: 1, pageSize: 10, totalPages: 11 })
      renderPage()

      const prev = await screen.findByRole('button', { name: /previous/i })
      expect(prev).toBeDisabled()
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
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
        data: {
          tickets: [{ ...TICKETS[0], category: null }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
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

    it('shows the assigned agent name when a ticket has an assignee', async () => {
      renderPage()

      await screen.findByText('Bob Agent')
    })

    it('shows an em-dash in the assigned column when a ticket has no assignee', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          tickets: [{ ...TICKETS[0], assignedTo: null }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      } as AxiosResponse)
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('calls GET /api/tickets with default sort and page params', async () => {
      renderPage()

      await screen.findByText('Cannot log in to my account')
      expect(api.get).toHaveBeenCalledWith(
        '/api/tickets?sortBy=createdAt&sortOrder=desc&page=1',
      )
    })
  })
})
