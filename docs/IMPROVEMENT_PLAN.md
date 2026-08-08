# Improvement Plan

## P0

- Keep `lib/utils.ts` restored and limited to safe local helpers
- Remove broken `/auth/forgot-password` link or implement the route
- Replace obviously wrong cross-domain mock content (`AC Repair`, unrelated testimonials, Melbourne map, rupee pricing)

## P1

- Define typed data models for auth, products, service requests, quotes, appointments, and orders
- Turn contact/auth/service-request screens into validated forms with explicit submission states
- Extract inline mock data from page components into dedicated modules

## P2

- Introduce semantic design tokens for brand, surfaces, text, borders, and radius
- Reduce unnecessary `"use client"` page boundaries where only small interactive islands are needed
- Create a thin API contract layer for future backend integration

## P3

- Improve accessibility for dialogs, focus states, keyboard behavior, and status messaging
- Normalize dashboard content so it matches the vacuum-service product domain
- Address Recharts container warnings with stable chart sizing

## P4

- Add automated test foundations
- Add better empty/loading/error states
- Polish copy, imagery, and visual consistency across landing and dashboard areas
