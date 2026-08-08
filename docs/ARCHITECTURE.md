# Architecture

## Current Shape

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS 4 plus large CSS modules for dashboard UI
- UI utilities: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`
- Charts: Recharts

## Route Structure

- `app/layout.tsx`
  - global font and `globals.css`
- `app/(landingPage)/layout.tsx`
  - shared `Navbar` + `Footer`
- `app/(dashboard)/admin/layout.tsx`
  - shared admin dashboard shell
- `app/(dashboard)/user/layout.tsx`
  - shared user dashboard shell

## Rendering Model

- Every route builds as static content in production.
- Many pages are marked `"use client"` even when most content is static.
- Interactivity is mostly local component state for menus, tabs, modals, and mock forms.

## Data Architecture

- No API client layer
- No `fetch()` integration
- No Axios
- No server actions
- No auth provider
- No persistent state/store
- No schemas or validation layer

## Component Organization

- `components/layout/*`
  - marketing nav/footer and dashboard shells
- `components/landing/*`
  - marketing sections and service modal flow
- `components/ui/Button.tsx`
  - shadcn-style button primitive using `cva` + Radix `Slot`

## Strengths

- Route groups are sensible and easy to follow.
- Shared landing/admin/user layouts are already separated.
- The visual direction is broadly consistent around teal/white service branding.
- The button primitive gives the project a decent starting point for a reusable UI layer.

## Main Gaps

- No boundary between UI mocks and future backend resources
- Dashboard pages mix presentation with large inline datasets
- Heavy use of hardcoded copy, dates, prices, and statuses
- Repeated color/radius/spacing values instead of semantic tokens
- Modal UX is custom and lacks dialog semantics/focus management
