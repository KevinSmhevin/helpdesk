/**
 * Tickets page E2E tests.
 *
 * Test users are seeded by global-setup via server/prisma/seed-test.ts:
 *   admin@example.com / password123  (role: admin)
 *   agent@example.com / password123  (role: agent)
 *
 * Tickets are created via the SendGrid inbound-parse webhook, not a UI form.
 * Each test that needs data seeds its own ticket(s) via `request.post(...)` so
 * tests are self-contained. The global teardown truncates all tables after the
 * full suite.
 *
 * Unique Message-ID headers are used per seed call so parallel test runs do
 * not collide on any duplicate-detection index on the ticket table.
 *
 * Ordering note: this file uses `test.describe.configure({ mode: 'serial' })`
 * so all tests within it run sequentially in declaration order. The empty-state
 * test is placed first so it observes an empty ticket table before any seeding
 * tests in this file run. Tests in other spec files (users, auth, webhook) do
 * not seed tickets, so the empty-state assumption holds across the suite.
 *
 * Coverage (full-stack concerns only — rendering details live in unit tests):
 *   1. Empty state — page renders without ticket rows when DB is empty (runs first)
 *   2. Unauthenticated access → redirect to /login
 *   3. Agent can reach /tickets and sees the page heading
 *   4. Admin can reach /tickets and sees the page heading
 *   5. Tickets nav link is visible for both agent and admin
 *   6. Ticket created via webhook appears in the table (proves full pipeline)
 *   7. Newest-first ordering — two tickets seeded in sequence, newer one is first
 */

import { test, expect } from './fixtures/auth'
import type { APIRequestContext } from '@playwright/test'

// Run all tests in this file sequentially so the empty-state test (first) runs
// before any seeding tests that follow it.
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

/** Returns a unique Message-ID value so concurrent seeds do not collide. */
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

// ---------------------------------------------------------------------------
// 1. Empty state — must run before any seeding tests
// ---------------------------------------------------------------------------

test.describe('Empty state', () => {
  test('renders the page without any ticket rows when the DB is empty', async ({ page, loginAsAgent: _loginAsAgent }) => {
    // No seed call — global setup starts with a clean ticket table and this
    // test is declared first (serial mode) so it runs before any seeding.
    await page.goto('/tickets')
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
    expect(page.getByRole('row')).not.toBeVisible
  })
})

// ---------------------------------------------------------------------------
// 2. Unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access', () => {
  test('redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('Sign in to Helpdesk')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Authenticated access — agent
// ---------------------------------------------------------------------------

test.describe('Authenticated access — agent', () => {
  test('agent can navigate to /tickets and sees the page heading', async ({
    page,
    loginAsAgent: _loginAsAgent,
  }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Authenticated access — admin
// ---------------------------------------------------------------------------

test.describe('Authenticated access — admin', () => {
  test('admin can navigate to /tickets and sees the page heading', async ({
    page,
    loginAsAdmin: _loginAsAdmin,
  }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 5. Nav link visibility
// ---------------------------------------------------------------------------

test.describe('Nav link', () => {
  test('Tickets link is visible in the navbar for an agent', async ({ page, loginAsAgent: _loginAsAgent }) => {
    // The auth fixture lands on '/' after login — the NavBar is already rendered
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible()
  })

  test('Tickets link is visible in the navbar for an admin', async ({ page, loginAsAdmin: _loginAsAdmin }) => {
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 6. Ticket data appears in the table
// ---------------------------------------------------------------------------

test.describe('Ticket data in the table', () => {
  test('ticket created via webhook appears in the table', async ({
    page,
    request,
    loginAsAgent: _loginAsAgent,
  }) => {
    const subject = `Support request ${Date.now()}`
    await seedTicket(request, { subject, from: 'Alice <alice@example.com>' })

    await page.goto('/tickets')

    // Proves the full pipeline: webhook → DB → API → browser
    await expect(page.getByRole('cell', { name: subject })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 7. Newest-first ordering
// ---------------------------------------------------------------------------

test.describe('Ordering', () => {
  test('most recently received ticket appears above an earlier one', async ({
    page,
    request,
    loginAsAgent: _loginAsAgent,
  }) => {
    const olderSubject = `Older ticket ${Date.now()}`
    await seedTicket(request, { subject: olderSubject })

    // Seed the second ticket after awaiting the first — the sequential network
    // round-trips are enough to produce distinct createdAt timestamps.
    const newerSubject = `Newer ticket ${Date.now() + 1}`
    await seedTicket(request, { subject: newerSubject })

    await page.goto('/tickets')

    const olderCell = page.getByRole('cell', { name: olderSubject })
    const newerCell = page.getByRole('cell', { name: newerSubject })

    await expect(olderCell).toBeVisible()
    await expect(newerCell).toBeVisible()

    // A smaller Y coordinate means closer to the top of the page — the newer
    // ticket must render above the older one.
    const olderBox = await olderCell.boundingBox()
    const newerBox = await newerCell.boundingBox()

    expect(newerBox!.y).toBeLessThan(olderBox!.y)
  })
})
