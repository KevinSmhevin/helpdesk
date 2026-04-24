/**
 * Auth E2E tests
 *
 * Test users are seeded by global-setup via server/prisma/seed-test.ts:
 *   admin@example.com / password123  (role: admin)
 *   agent@example.com / password123  (role: agent)
 *
 * The fixture test object extends Playwright's base test with `loginAsAdmin`
 * and `loginAsAgent` fixtures that handle login and wait for the post-login
 * redirect to `/` before each test body runs.
 *
 * Tests that need an unauthenticated browser use Playwright's base `test`
 * directly so no session is established.
 */

import { test, expect } from './fixtures/auth'
import { test as base } from '@playwright/test'
import { expectLoginPage, expectDashboardPage } from './helpers'

// ---------------------------------------------------------------------------
// 1. Login — happy paths
// ---------------------------------------------------------------------------

test.describe('Login — happy paths', () => {
  test('admin can sign in and lands on /', async ({ page, loginAsAdmin }) => {
    await expectDashboardPage(page)
    // NavBar shows the signed-in user's name ("Admin" as seeded)
    await expect(page.getByText('Admin')).toBeVisible()
  })

  test('agent can sign in and lands on /', async ({ page, loginAsAgent }) => {
    await expectDashboardPage(page)
    await expect(page.getByText('Agent')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Login — error states
// ---------------------------------------------------------------------------

// These tests use the base Playwright `test` (no pre-login) because they exercise
// the login form itself, including its unauthenticated state.

base.describe('Login — error states', () => {
  base('wrong password shows a server error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // LoginPage renders: {serverError && <p className="text-sm text-destructive">{serverError}</p>}
    // Better Auth returns a descriptive message; we assert with a regex to avoid
    // coupling to the exact string the server returns.
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    await expectLoginPage(page)
  })

  base('non-existent email shows a server error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    await expectLoginPage(page)
  })

  base('empty form submission triggers client-side validation errors', async ({ page }) => {
    await page.goto('/login')
    // Click Sign in without filling in any fields.
    // react-hook-form with zodResolver fires validation for all fields on submit.
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Zod schema: email — 'Email is required', password — 'Password is required'
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    await expectLoginPage(page)
  })

  base('invalid email format triggers a client-side validation error', async ({ page }) => {
    await page.goto('/login')
    // react-hook-form is configured with mode: 'onTouched', so validation fires on blur.
    const emailInput = page.getByLabel('Email')
    await emailInput.fill('not-an-email')
    await emailInput.blur()

    // Zod schema: email — 'Enter a valid email address'
    await expect(page.getByText('Enter a valid email address')).toBeVisible()
    // Password has not been touched — its error must not be visible yet
    await expect(page.getByText('Password is required')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Session persistence
// ---------------------------------------------------------------------------

test.describe('Session persistence', () => {
  test('authenticated user who refreshes the page stays logged in', async ({
    page,
    loginAsAdmin,
  }) => {
    // A hard reload re-runs ProtectedRoute with the existing session cookie.
    // If the session were lost the route would redirect to /login.
    await page.reload()
    await expectDashboardPage(page)
  })
})

// ---------------------------------------------------------------------------
// 4. Sign-out
// ---------------------------------------------------------------------------

test.describe('Sign-out', () => {
  test('signing out redirects to /login', async ({ page, loginAsAdmin }) => {
    // NavBar renders a <button> with text "Sign out"
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expectLoginPage(page)
  })

  test('after sign-out, visiting / redirects back to /login', async ({ page, loginAsAdmin }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expectLoginPage(page)

    // Direct navigation to the protected route should be denied
    await page.goto('/')
    await expectLoginPage(page)
  })
})

// ---------------------------------------------------------------------------
// 5. Route protection — ProtectedRoute
// ---------------------------------------------------------------------------

base.describe('Route protection — ProtectedRoute', () => {
  base('unauthenticated user visiting / is redirected to /login', async ({ page }) => {
    await page.goto('/')
    await expectLoginPage(page)
  })
})

// ---------------------------------------------------------------------------
// 6. Route protection — AdminRoute
// ---------------------------------------------------------------------------

base.describe('Route protection — AdminRoute (unauthenticated)', () => {
  base('unauthenticated user visiting /users is redirected to /login', async ({ page }) => {
    await page.goto('/users')
    await expectLoginPage(page)
  })
})

test.describe('Route protection — AdminRoute (authenticated)', () => {
  test('agent (non-admin) visiting /users is redirected to /', async ({ page, loginAsAgent }) => {
    // Attempt to access the admin-only route
    await page.goto('/users')

    // AdminRoute checks role === 'admin'; agent fails and is redirected to /
    await expectDashboardPage(page)
  })

  test('admin can visit /users and sees the Users heading', async ({ page, loginAsAdmin }) => {
    await page.goto('/users')

    await expect(page).toHaveURL('/users')
    // UsersPage renders: <h1 className="text-2xl font-semibold">Users</h1>
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })
})
