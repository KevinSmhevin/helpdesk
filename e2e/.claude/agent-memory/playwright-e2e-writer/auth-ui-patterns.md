---
name: Auth UI patterns
description: Exact selectors, labels, error strings, and ARIA roles for the login page and NavBar
type: reference
---

## LoginPage (`client/src/pages/LoginPage.tsx`)

- Card heading: `Sign in to Helpdesk` (CardTitle, rendered as an h3 inside the Card)
- Email field label: `Email` (htmlFor="email") — use `page.getByLabel('Email')`
- Password field label: `Password` (htmlFor="password") — use `page.getByLabel('Password')`
- Submit button: `<Button type="submit">` — text is `'Sign in'` (idle) / `'Signing in…'` (submitting)
  - Selector: `page.getByRole('button', { name: 'Sign in' })`
- Client-side validation error strings (from Zod schema):
  - Empty email: `'Email is required'`
  - Invalid email format: `'Enter a valid email address'`
  - Empty password: `'Password is required'`
  - Rendered as `<p className="text-xs text-destructive">` below each field
- Server error: `<p className="text-sm text-destructive">{serverError}</p>` below both fields, above the button
  - Better Auth returns a message matching `/invalid email or password/i` for wrong credentials and missing users
- form mode is `onTouched` — field errors appear on blur or on submit attempt

## NavBar (`client/src/components/NavBar.tsx`)

- Sign-out is a plain HTML `<button>` (NOT a shadcn Button wrapper), text: `'Sign out'`
  - Selector: `page.getByRole('button', { name: 'Sign out' })`
- User name is rendered as `<span>{session.user.name}</span>` — match with `page.getByText('Admin')` etc.
- Seeded names: Admin user name = `'Admin'`, Agent user name = `'Agent'`

## HomePage (`client/src/pages/HomePage.tsx`)

- `<h1>Dashboard</h1>` — `page.getByRole('heading', { name: 'Dashboard' })`

## UsersPage (`client/src/pages/UsersPage.tsx`)

- `<h1>Users</h1>` — `page.getByRole('heading', { name: 'Users' })`

## Route structure (`client/src/App.tsx`)

- `/login` — public, LoginPage
- `/` — ProtectedRoute (any authenticated session), HomePage
- `/users` — AdminRoute (role === 'admin' required), UsersPage
- ProtectedRoute: redirects to `/login` when no session
- AdminRoute: redirects to `/login` when no session; redirects to `/` when role !== 'admin'
