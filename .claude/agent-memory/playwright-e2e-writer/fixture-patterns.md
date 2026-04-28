---
name: Fixture patterns
description: How auth fixtures are structured and the base.test pitfall to avoid
type: feedback
---

Auth fixtures live in `e2e/tests/fixtures/auth.ts` and export a `test` extended from Playwright's base.

**Why:** Centralises login logic; fixture runs before each test body and hands off after `use()`.

**How to apply:**
- Import the fixture `test` (and re-exported `expect`) for tests that need a logged-in session.
- Import `test as base` from `@playwright/test` for tests that need no session (unauthenticated scenarios).
- NEVER call `base.test(...)` — `TestType` is directly callable as `base(...)` and exposes `.describe`
  but NOT a `.test` property. Calling `base.test(...)` causes a TS2339 type error.
  Correct pattern:
    ```ts
    base.describe('some group', () => {
      base('test name', async ({ page }) => { ... })  // NOT base.test(...)
    })
    ```
- The `loginAs` helper uses `page.waitForURL('/')` (not `toHaveURL`) because it runs outside a test body
  where `expect` from the fixture module isn't strictly needed — `waitForURL` throws on timeout naturally.
- Fixture type declaration uses `void` for fixture values that don't yield a value:
    ```ts
    type AuthFixtures = { loginAsAdmin: void; loginAsAgent: void }
    ```
