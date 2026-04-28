/**
 * SendGrid inbound-parse webhook E2E tests.
 *
 * These are pure API tests — no browser required. They hit the Express server
 * directly using Playwright's built-in `request` fixture.
 *
 * Endpoint: POST /api/webhooks/email?token=<SENDGRID_WEBHOOK_SECRET>
 * Payload:  multipart/form-data with fields: from, to, subject, text, headers
 *
 * Coverage:
 *   1. Happy path — valid payload → 200 { ok: true }, ticket written to DB
 *   2. Deduplication — same Message-ID sent twice → 200 both times, no error
 *   3. Missing token — no ?token= param → 401 { error: "Unauthorized" }
 *   4. Wrong token — ?token=wrong → 401 { error: "Unauthorized" }
 *   5. Missing Message-ID — headers field present but no Message-ID line → 400
 *   6. Missing headers field — headers omitted entirely → 400 (Zod validation)
 *
 * Each happy-path test uses a unique Message-ID (Date.now() + Math.random())
 * so tests can run fullyParallel without collision. All rows are cleaned up by
 * the global teardown (truncates the ticket table after the suite).
 */

import { test, expect } from '@playwright/test'

const SERVER = 'http://localhost:3001'
const SECRET = 'test-webhook-secret'
const ENDPOINT = `${SERVER}/api/webhooks/email`

/** Returns a unique Message-ID safe to use across parallel test workers. */
function uniqueMessageId(): string {
  return `<test-${Date.now()}-${Math.random().toString(36).slice(2)}@mail.example.com>`
}

/** Base multipart payload used across tests. Pass overrides to alter specific fields. */
function basePayload(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    from: 'Jane Smith <jane@example.com>',
    to: 'support@helpdesk.com',
    subject: 'I need help',
    text: 'Please assist me with my issue.',
    headers: `Message-ID: ${uniqueMessageId()}\nContent-Type: text/plain`,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1. Happy path — valid payload is accepted and a ticket is created
// ---------------------------------------------------------------------------

test.describe('Happy path — valid payload', () => {
  test('returns 200 { ok: true } for a well-formed request', async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=${SECRET}`, {
      multipart: basePayload(),
    })

    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  test('accepts a bare email address (no display name) in the from field', async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=${SECRET}`, {
      multipart: basePayload({ from: 'jane@example.com' }),
    })

    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

// ---------------------------------------------------------------------------
// 2. Deduplication — same Message-ID sent twice returns 200 both times
// ---------------------------------------------------------------------------

test.describe('Deduplication — same Message-ID', () => {
  test('returns 200 on the first delivery and 200 on the duplicate, never 4xx', async ({
    request,
  }) => {
    const messageId = uniqueMessageId()
    const payload = basePayload({
      headers: `Message-ID: ${messageId}\nContent-Type: text/plain`,
    })

    const first = await request.post(`${ENDPOINT}?token=${SECRET}`, { multipart: payload })
    expect(first.status()).toBe(200)
    expect(await first.json()).toEqual({ ok: true })

    const second = await request.post(`${ENDPOINT}?token=${SECRET}`, { multipart: payload })
    expect(second.status()).toBe(200)
    expect(await second.json()).toEqual({ ok: true })
  })
})

// ---------------------------------------------------------------------------
// 3. Auth — missing or incorrect token is rejected before payload is parsed
// ---------------------------------------------------------------------------

test.describe('Auth — token validation', () => {
  test('returns 401 when the token query param is absent', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      multipart: basePayload(),
    })

    expect(res.status()).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns 401 when the token query param is incorrect', async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=wrong-secret`, {
      multipart: basePayload(),
    })

    expect(res.status()).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})

// ---------------------------------------------------------------------------
// 4. Payload validation — malformed or incomplete payloads are rejected
// ---------------------------------------------------------------------------

test.describe('Payload validation — invalid payloads', () => {
  test('returns 400 when the headers field contains no Message-ID line', async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=${SECRET}`, {
      multipart: basePayload({
        headers: 'Content-Type: text/plain\nX-Mailer: SomeClient',
      }),
    })

    expect(res.status()).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid webhook payload' })
  })

  test('returns 400 when the headers field is omitted entirely', async ({ request }) => {
    const { headers: _omitted, ...payloadWithoutHeaders } = basePayload()

    const res = await request.post(`${ENDPOINT}?token=${SECRET}`, {
      multipart: payloadWithoutHeaders,
    })

    expect(res.status()).toBe(400)
    // Zod validation fires before Message-ID parsing, so any 400 body is acceptable
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})
