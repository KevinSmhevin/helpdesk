/**
 * Ticket detail page E2E tests (`/tickets/:id`).
 *
 * Unit tests in TicketDetailPage.test.tsx already cover all rendering details
 * (loading state, error state, field display, status/category/assignment
 * interactions, reply thread rendering). These tests cover only the concerns
 * that require a real browser, server, and database:
 *
 *   1. Unauthenticated access → redirect to /login
 *   2. Navigate from ticket list → detail page subject heading is correct
 *   3. Back to tickets link navigates back to /tickets
 *   4. Reply form full-stack pipeline → submitted reply body appears in thread
 *
 * Tickets are always created via the SendGrid inbound-parse webhook, not a UI
 * form. The global teardown truncates all tables after the full suite.
 */

import { test, expect } from './fixtures/auth'
import { test as base, type Page } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { expectLoginPage } from './helpers'

// Run sequentially — tests share the real DB via seeded tickets.
test.describe.configure({ mode: 'serial' })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVER = 'http://localhost:3001'
const WEBHOOK_SECRET = 'test-webhook-secret'
const WEBHOOK_URL = `${SERVER}/api/webhooks/email?token=${WEBHOOK_SECRET}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a unique Message-ID so concurrent seeds do not collide. */
function uniqueMessageId(): string {
  return `<${Date.now()}-${Math.random().toString(36).slice(2)}@mail.example.com>`
}

/** Seeds one ticket via the SendGrid inbound-parse webhook. */
async function seedTicket(
  request: APIRequestContext,
  options: {
    subject: string
    from?: string
    text?: string
  },
): Promise<void> {
  const { subject, from = 'Alice <alice@example.com>', text = 'Test body.' } = options

  await request.post(WEBHOOK_URL, {
    multipart: {
      from,
      to: 'support@helpdesk.com',
      subject,
      text,
      headers: `Message-ID: ${uniqueMessageId()}\nContent-Type: text/plain`,
    },
  })
}

/**
 * Navigates to /tickets, finds the subject cell, clicks the link inside it,
 * and waits until the URL matches /tickets/:id. Returns the detail page URL.
 */
async function navigateToDetailPage(page: Page, subject: string) {
  await page.goto('/tickets')
  const subjectLink = page.getByRole('cell', { name: subject }).getByRole('link')
  await subjectLink.click()
  await page.waitForURL(/\/tickets\//)
}

// ---------------------------------------------------------------------------
// 1. Unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access', () => {
  base('redirects to /login when visiting a ticket detail URL without a session', async ({ page }) => {
    // Use a plausible-looking but non-existent ticket ID — the redirect must
    // happen before the server is even consulted for the ticket data.
    await page.goto('/tickets/some-ticket-id')
    await expectLoginPage(page)
  })
})

// ---------------------------------------------------------------------------
// 2. Navigate from list to detail page
// ---------------------------------------------------------------------------

test.describe('Navigate to detail page', () => {
  test('clicking a ticket subject link opens the detail page with the correct heading', async ({
    page,
    request,
    loginAsAgent: _loginAsAgent,
  }) => {
    const subject = `Detail nav test ${Date.now()}`
    await seedTicket(request, { subject })

    await navigateToDetailPage(page, subject)

    // The subject is rendered as an <h1> in TicketDetailPage — proves the
    // correct ticket was loaded from the real DB.
    await expect(page.getByRole('heading', { name: subject, level: 1 })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Back to tickets link
// ---------------------------------------------------------------------------

test.describe('Back to tickets link', () => {
  test('clicking "Back to tickets" navigates back to /tickets', async ({
    page,
    request,
    loginAsAgent: _loginAsAgent,
  }) => {
    const subject = `Back link test ${Date.now()}`
    await seedTicket(request, { subject })

    await navigateToDetailPage(page, subject)

    // Confirm we landed on the detail page before testing the link.
    await expect(page).toHaveURL(/\/tickets\//)

    await page.getByRole('link', { name: /back to tickets/i }).click()
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Reply form — full-stack pipeline
// ---------------------------------------------------------------------------

test.describe('Reply form', () => {
  test('submitting a reply causes the reply body to appear in the thread', async ({
    page,
    request,
    loginAsAgent: _loginAsAgent,
  }) => {
    const subject = `Reply pipeline test ${Date.now()}`
    await seedTicket(request, { subject })

    await navigateToDetailPage(page, subject)

    // Wait for the detail page to finish loading (h1 visible means the ticket
    // data has resolved from the real API).
    await expect(page.getByRole('heading', { name: subject, level: 1 })).toBeVisible()

    const replyBody = `E2E reply ${Date.now()}`

    await page.getByPlaceholder('Write a reply…').fill(replyBody)
    await page.getByRole('button', { name: 'Send reply' }).click()

    // The reply body must appear in the thread — proves the full pipeline:
    // POST /api/tickets/:id/replies → DB → cache update → browser render.
    await expect(page.getByText(replyBody)).toBeVisible()
  })
})
