/**
 * User management E2E tests — happy paths only.
 *
 * Test users are seeded by global-setup via server/prisma/seed-test.ts:
 *   admin@example.com / password123  (role: admin, name: "Admin")
 *   agent@example.com / password123  (role: agent, name: "Agent")
 *
 * All tests use the `loginAsAdmin` fixture — /users is an admin-only route.
 * The fixture logs in and waits for the redirect to `/` before each test body
 * runs. Tests then navigate to `/users` explicitly.
 *
 * Each test that creates a user uses a unique email (Date.now() suffix) so
 * tests can run in parallel without conflicts. The global teardown truncates
 * all tables after the full suite.
 *
 * Coverage notes: UI behaviour already covered by component tests is not
 * repeated here. These tests focus on full-stack correctness — real API calls,
 * real database writes, and cross-concern flows (e.g. create → sign in).
 */

import { test, expect } from './fixtures/auth'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type Page = Parameters<Parameters<typeof test>[1]>[0]['page']

/**
 * Creates a new agent via the Add agent form and waits for the row to appear.
 * Scopes form interactions to #add-agent-form to avoid matching edit buttons
 * elsewhere in the table (which also have aria-labels containing "Email" etc.).
 */
async function createAgent(page: Page, name: string, email: string, password = 'password123') {
  await page.getByRole('button', { name: 'Add agent' }).click()
  const form = page.locator('#add-agent-form')
  await form.getByLabel('Name').fill(name)
  await form.getByLabel('Email').fill(email)
  await form.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create agent' }).click()
  // exact: true avoids matching the action cell whose accessible name is "Edit {name} Delete"
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible()
}

/** Signs out the current user and signs in as a different user. */
async function signInAs(page: Page, email: string, password: string) {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// 1. Read — seeded users appear in the table with real data from the database
// ---------------------------------------------------------------------------

test.describe('Read — users table', () => {
  test('shows the seeded admin and agent rows with correct role badges', async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto('/users')

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

    // Locate rows by email to avoid substring collisions with other parallel-test users
    const adminRow = page.getByRole('row', { name: /admin@example\.com/i })
    await expect(adminRow).toBeVisible()
    // exact: true matches only the role badge span, not "Admin" or "admin@example.com"
    await expect(adminRow.getByText('admin', { exact: true })).toBeVisible()

    const agentRow = page.getByRole('row', { name: /agent@example\.com/i })
    await expect(agentRow).toBeVisible()
    await expect(agentRow.getByText('agent', { exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Create — new agent is written to the database and appears in the table
// ---------------------------------------------------------------------------

test.describe('Create — add agent form', () => {
  test('new agent row appears in the table after submission', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `New Agent ${Date.now()}`
    const email = `newagent+${Date.now()}@example.com`

    await createAgent(page, name, email)

    await expect(page.getByRole('cell', { name: email })).toBeVisible()
  })

  test('created agent persists after a full page reload', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Persistent Agent ${Date.now()}`
    const email = `persist+${Date.now()}@example.com`

    await createAgent(page, name, email)

    await page.reload()

    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: email })).toBeVisible()
  })

  test('created agent can sign in with their credentials', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Signable Agent ${Date.now()}`
    const email = `signin+${Date.now()}@example.com`
    const password = 'agentpassword1'

    await createAgent(page, name, email, password)
    await signInAs(page, email, password)

    await expect(page).toHaveURL('/')
    await expect(page.getByText(name)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Update — changes are written to the database and reflected in the table
// ---------------------------------------------------------------------------

test.describe('Update — edit user dialog', () => {
  test('updated name is reflected in the table', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    // Wait for the seeded Agent row by email (avoids strict-mode violations
    // when parallel tests have added other users whose names contain "Agent")
    await expect(page.getByRole('row', { name: /agent@example\.com/ })).toBeVisible()

    // exact: true ensures we only match the button for the user named exactly "Agent"
    await page.getByRole('button', { name: 'Edit Agent', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const updatedName = `Agent Renamed ${Date.now()}`
    await dialog.getByLabel('Name').clear()
    await dialog.getByLabel('Name').fill(updatedName)
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('cell', { name: updatedName, exact: true })).toBeVisible()
  })

  test('updated email is reflected in the table', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Email Agent ${Date.now()}`
    const originalEmail = `orig+${Date.now()}@example.com`
    const updatedEmail = `updated+${Date.now()}@example.com`

    await createAgent(page, name, originalEmail)

    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Email').clear()
    await dialog.getByLabel('Email').fill(updatedEmail)
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('cell', { name: updatedEmail })).toBeVisible()
  })

  test('updated name persists after a full page reload', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Reload Agent ${Date.now()}`
    const email = `reload+${Date.now()}@example.com`
    const updatedName = `Reload Agent Renamed ${Date.now()}`

    await createAgent(page, name, email)

    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').clear()
    await dialog.getByLabel('Name').fill(updatedName)
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog).not.toBeVisible()

    await page.reload()

    await expect(page.getByRole('cell', { name: updatedName, exact: true })).toBeVisible()
  })

  test('password change allows the agent to sign in with the new password', async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto('/users')

    const name = `PwChange Agent ${Date.now()}`
    const email = `pwchange+${Date.now()}@example.com`
    const newPassword = 'newpassword99'

    await createAgent(page, name, email)

    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()

    const dialog = page.getByRole('dialog')
    // Wait for the useEffect to populate the form before filling the password field.
    // Without this, form.reset({ password: '' }) can run after fill() and clear it.
    await expect(dialog.getByLabel('Name')).toHaveValue(name)
    await dialog.getByLabel('New password').fill(newPassword)
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog).not.toBeVisible()

    await signInAs(page, email, newPassword)

    await expect(page).toHaveURL('/')
    await expect(page.getByText(name)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Delete — soft delete removes the user from the table and the database
// ---------------------------------------------------------------------------

test.describe('Delete — soft delete agent', () => {
  test('confirmed deletion removes the row from the table', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Delete Me ${Date.now()}`
    const email = `delete+${Date.now()}@example.com`

    await createAgent(page, name, email)

    // Use filter({ hasText }) instead of RegExp — the email contains '+' which is a
    // regex quantifier and would silently break new RegExp(email, 'i').
    const row = page.locator('tr').filter({ hasText: email })
    // exact: true prevents matching the Edit button whose aria-label "Edit Delete Me…"
    // also contains the word "Delete".
    await row.getByRole('button', { name: 'Delete', exact: true }).click()

    const alertDialog = page.getByRole('alertdialog')
    await alertDialog.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(row).not.toBeVisible()
  })

  test('deleted user does not reappear after a full page reload', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    const name = `Gone After Reload ${Date.now()}`
    const email = `gone+${Date.now()}@example.com`

    await createAgent(page, name, email)

    const row = page.locator('tr').filter({ hasText: email })
    await row.getByRole('button', { name: 'Delete', exact: true }).click()

    const alertDialog = page.getByRole('alertdialog')
    await alertDialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(row).not.toBeVisible()

    await page.reload()

    await expect(page.getByRole('cell', { name, exact: true })).not.toBeVisible()
  })
})
