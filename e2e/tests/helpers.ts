import { expect, type Page } from '@playwright/test'

export async function expectLoginPage(page: Page) {
  await expect(page).toHaveURL('/login')
  await expect(page.getByText('Sign in to Helpdesk')).toBeVisible()
}

export async function expectDashboardPage(page: Page) {
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}
