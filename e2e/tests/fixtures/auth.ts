import { test as base, type Page } from '@playwright/test'

// Credentials match the users created by global-setup (server/prisma/seed-test.ts)
const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'password123'
const AGENT_EMAIL = 'agent@example.com'
const AGENT_PASSWORD = 'password123'

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // Wait for the redirect to / that LoginPage performs on success
  await page.waitForURL('/')
}

type AuthFixtures = {
  loginAsAdmin: void
  loginAsAgent: void
}

export const test = base.extend<AuthFixtures>({
  loginAsAdmin: async ({ page }, use) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await use()
  },

  loginAsAgent: async ({ page }, use) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD)
    await use()
  },
})

export { expect } from '@playwright/test'
