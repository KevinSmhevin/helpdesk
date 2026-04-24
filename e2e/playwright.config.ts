import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

loadEnv({ path: resolve(__dirname, '../server/.env.test') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'bun src/index.ts',
      cwd: resolve(__dirname, '../server'),
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run dev -- --port 5174',
      cwd: resolve(__dirname, '../client'),
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: 'http://localhost:3001',
      },
    },
  ],
})
