<p align="center">
  <img src="app/logo.png" alt="Elite Central Vacuum" width="72" height="72" />
</p>

<h1 align="center">Elite Central Vacuum</h1>

<p align="center">
  <strong>Full-stack commerce &amp; field-service platform for central vacuum systems</strong>
</p>

<p align="center">
  <a href="https://elite-vaccum-frontend.vercel.app/">🌐 Live URL</a>&nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#features">Features</a>&nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#architecture">Architecture</a>&nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-RTK_Query-764ABC?logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel" alt="Vercel" />
</p>

---

## Overview

Elite Central Vacuum is a production-grade web application that combines **e-commerce**, **professional service management**, and **multi-role dashboards** into a single platform. Built for a real-world central vacuum business, it covers the complete lifecycle — from product discovery and checkout, through service booking and technician dispatch, to invoicing and customer account management.

> **Live:** [elite-vaccum-frontend.vercel.app](https://elite-vaccum-frontend.vercel.app/)

---

## Features

### 🛒 Commerce Engine

| Capability | Details |
|:---|:---|
| **Product Catalog** | Filterable grid with category taxonomy, price-range sliders, brand facets, and sort controls |
| **Product Detail Pages** | Image gallery, tabbed specs/reviews, dynamic variant selection, related-product recommendations |
| **Cart & Checkout** | Persistent cart with quantity controls, real-time order totals, shipping address form with Zod validation, Stripe-ready payment integration |
| **Order Confirmation** | Post-checkout success page with receipt breakdown and recommended next steps |

### 🔧 Service Management

| Capability | Details |
|:---|:---|
| **Service Catalog** | Categorized service listings (installation, repair, maintenance) with pricing tiers and inclusion breakdowns |
| **Multi-Step Booking Wizard** | Step indicator, property details collection, date/time slot picker, and service type selection — all form-validated |
| **Quotation Workflow** | Admin-generated quotes with line items → customer review → accept/reject flow with status tracking |
| **Scheduling** | Calendar-based appointment views for customers, technicians, and admins with reschedule/cancel capabilities |

### 👤 Customer Portal

- **Dashboard overview** — upcoming services, recent orders, quick-book banner
- **Order history** — filterable list with status badges, timeline tracker, and per-order invoice detail
- **Service requests** — full lifecycle tracking from submitted → quoted → scheduled → completed
- **Billing center** — invoice history table, saved payment methods, per-invoice detail views
- **Quotation management** — review pending quotes, accept/reject with decision panel
- **Reviews** — submit and manage product/service reviews
- **Profile & settings** — personal info, password change, notification preferences

### 🛠️ Technician Portal

- **Daily dashboard** — job metrics cards, next-job preview, route overview
- **Job management** — assigned work orders with filter tabs, job ticket cards, status progression
- **Job execution** — step-by-step work checklist, parts-used tracking, customer signature pad, job completion with invoice generation
- **Mobile-first layout** — bottom navigation bar, touch-optimized controls, responsive sidebar

### ⚙️ Admin Console

- **Analytics dashboard** — KPI cards, revenue charts (Recharts), order volume trends
- **Product management** — CRUD with image upload dropzone, pricing tier inputs, variant editor, stock adjusters
- **Category management** — hierarchical category CRUD with product association
- **Order management** — data table with batch actions, bulk status updates, fulfillment tracking, refund/cancel workflows
- **Service request triage** — request table with technician assignment dropdown, dispatch modal
- **Quotation pipeline** — pipeline board view, quotation builder, send-quote email dialog
- **Customer management** — customer directory with detail views and order history
- **Technician management** — technician roster, assignment tracking, detail views
- **Financials** — invoice management, payment status tracking, financial reporting
- **Reports** — business intelligence reporting with configurable parameters
- **Review moderation** — review approval queue with rating analytics
- **Role-gated access** — `RoleGate` component enforces admin-only access at the layout level

---

## Architecture

### Tech Stack

| Layer | Technology |
|:---|:---|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4, Radix UI primitives, Lucide icons |
| **State** | Redux Toolkit + RTK Query with automatic cache tagging/invalidation |
| **Forms** | React Hook Form + Zod schema validation |
| **Animation** | Framer Motion (respects `prefers-reduced-motion`) |
| **Real-Time** | Socket.IO client for live notifications |
| **Charts** | Recharts for admin analytics dashboards |
| **Notifications** | Sonner toast system |
| **Language** | Strict TypeScript throughout — no implicit `any` |

### Project Structure

```
app/
├── (landingPage)/          # Public storefront routes
│   ├── store/              # Product catalog & PDP
│   ├── services/           # Service catalog, detail, booking wizard
│   ├── cart/               # Cart review
│   ├── checkout/           # Checkout flow & success confirmation
│   ├── about/ contact/     # Company pages
│   └── privacy/ terms/     # Legal pages
├── (dashboard)/
│   ├── admin/              # Admin console (role-gated)
│   ├── technician/         # Technician portal (mobile-first)
│   └── user/               # Customer dashboard
└── auth/                   # Login, register, forgot-password

components/
├── admin/                  # Admin-specific components (12 feature modules)
├── auth/                   # Auth forms, one-click demo login
├── customer-portal/        # Customer dashboard components
├── forms/                  # Shared form primitives & styles
├── invoices/               # Invoice card components
├── landing/                # Landing page sections (home, service, about, contact)
├── layout/                 # Navbar, Footer, Sidebar, Header per role
├── motion/                 # Animation wrappers (reduced-motion aware)
├── store/                  # E-commerce components (catalog, cart, checkout, PDP)
├── technician/             # Technician job & overview components
├── shared/                 # Cross-cutting shared components
└── ui/                     # Design system primitives (Button, Dialog, Sheet, etc.)

redux/
├── api/                    # 20+ RTK Query API slices with typed endpoints
├── slices/                 # Auth, cart, UI, chat state slices
└── store.ts                # Store configuration with middleware

hooks/                      # Custom React hooks
├── useCartSync.ts          # Local-first cart ↔ API synchronization
├── useNotificationSocket.ts # WebSocket notification listener
└── useDebouncedValue.ts    # Input debouncing for search/filters

types/                      # Centralized TypeScript domain types
lib/                        # Utilities, validation schemas, API helpers
data/mock/                  # Mock data layer for development
```

### Data Flow & State Management

```
┌──────────────┐    RTK Query     ┌─────────────┐    REST API    ┌──────────┐
│  Components  │ ◄──────────────► │  Redux Store │ ◄────────────► │ Backend  │
│              │   cache + tags   │             │   baseApi.ts   │          │
└──────┬───────┘                  └──────┬──────┘                └──────────┘
       │                                 │
       │  useAppSelector/Dispatch        │  Slices: auth, cart, ui, chat
       │  useCartSync (local-first)      │  20+ API slices with tag invalidation
       │  useNotificationSocket          │  Socket.IO for real-time updates
       ▼                                 ▼
┌──────────────┐                  ┌─────────────┐
│  React Hook  │                  │  Zod Schema │
│  Form State  │ ◄──────────────► │  Validation │
└──────────────┘   @hookform/     └─────────────┘
                   resolvers
```

### Design System

- **Brand tokens** — Elite Teal (`#0f766e` / `#0d9488`) with Slate neutral palette
- **Primitives** — Radix UI headless components (Dialog, Select, Popover, DropdownMenu, RadioGroup) styled with Tailwind
- **Feedback** — Sonner toasts, skeleton loaders, inline form validation, status badges
- **Component library** — Button, Input, Select, Card, Badge, Table, Tabs, Sheet (drawer), Accordion, Carousel, Separator

---

## Performance & Optimizations

| Optimization | Implementation |
|:---|:---|
| **RTK Query cache management** | Tag-based automatic invalidation — mutations invalidate only affected query caches, eliminating redundant network requests |
| **Local-first cart** | `useCartSync` hook persists cart state locally and reconciles with the API on auth, reducing perceived latency |
| **Debounced search** | `useDebouncedValue` hook prevents excessive API calls during catalog filtering and search |
| **Code splitting** | Next.js App Router automatic route-based code splitting — each dashboard portal loads independently |
| **Font optimization** | `next/font` with Geist font family — zero layout shift, self-hosted subset |
| **Image optimization** | Next.js `<Image>` with automatic resizing, format negotiation, and lazy loading |
| **Component-level loading states** | Skeleton loaders on every data-fetching component — no blank flashes |
| **Reduced motion** | Framer Motion animations respect `prefers-reduced-motion` media query |

---

## API Integration

The frontend communicates with a **NestJS REST API** backend through a centralized RTK Query layer (`redux/api/baseApi.ts`). Every API slice uses typed request/response contracts and automatic cache tag management.

**20+ API domains covered:**

| Domain | Operations |
|:---|:---|
| Authentication | Login, register, session refresh, logout |
| Products | CRUD, variant management, image upload |
| Categories | Hierarchical CRUD, product association |
| Orders | Checkout, status transitions, fulfillment, cancellation |
| Cart | Add/update/remove items, sync with authenticated session |
| Services | Service catalog CRUD, slug-based lookup |
| Service Requests | Multi-step creation, status progression, technician assignment |
| Quotations | Quote builder, customer accept/reject, admin pipeline |
| Invoices & Billing | Invoice generation, payment processing, history |
| Technician Jobs | Assignment, status stepper, job completion |
| Customers | Directory, detail views, order history lookup |
| Reviews | Submission, moderation, analytics |
| Notifications | Real-time via Socket.IO, read/unread management |
| Addresses | CRUD for shipping/billing addresses |
| Reports | Configurable business intelligence queries |
| Settings | User and system-level preference management |

---

## Route Map

### Public Routes

| Route | Page |
|:---|:---|
| `/` | Marketing homepage with hero, trust signals, featured products, testimonials |
| `/store` | Product catalog with filters, sort, and pagination |
| `/store/[slug]` | Product detail page with gallery, tabs, reviews |
| `/services` | Professional service catalog with category tabs |
| `/services/[slug]` | Service detail with pricing tiers and FAQ |
| `/services/request` | Multi-step service booking wizard |
| `/cart` | Full cart review with order totals |
| `/checkout` | Shipping + payment checkout flow |
| `/checkout/success` | Order confirmation receipt |
| `/about` | Company information |
| `/contact` | Contact form |

### Authenticated Routes

| Portal | Route Prefix | Key Pages |
|:---|:---|:---|
| **Customer** | `/user` | Overview, orders, services, quotations, schedule, billing, reviews, profile, settings |
| **Technician** | `/technician` | Overview, jobs, job detail (execution), schedule, notifications, profile |
| **Admin** | `/admin` | Analytics, orders, products, categories, quotations, service requests, schedule, customers, technicians, financials, reports, reviews, notifications, settings |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aryegrunzweig-frontend.git
cd aryegrunzweig-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Development

```bash
npm run dev        # Start dev server on port 3001
npm run build      # Production build
npm run start      # Production server on port 3001
npm run lint       # ESLint check
```

### Demo Accounts

The application includes a **one-click login** modal for exploring all three role portals without manual credential entry:

| Role | Email | Portal |
|:---|:---|:---|
| Administrator | `admin@elitecentralvac.com` | `/admin` |
| Technician | `technician@elitecentralvac.com` | `/technician` |
| Customer | `zayed@yzcalo.com` | `/user` |

---

## Form Validation

All user-facing forms use **Zod schemas** resolved through React Hook Form for type-safe, declarative validation:

- **Auth** — login, registration, password reset
- **Checkout** — shipping address, payment method, guest checkout
- **Services** — multi-step booking wizard (property details, scheduling)
- **Admin** — product forms, category forms, quotation builder, technician assignment
- **Customer** — review submission, profile updates, contact form

---

## Deployment

The frontend is deployed on **Vercel** with automatic preview deployments on pull requests.

```
Production:  https://elite-vaccum-frontend.vercel.app/
Framework:   Next.js 16 (auto-detected)
Build:       npm run build
Output:      .next/
```

---

## License

Private — proprietary project for Elite Central Vacuum.
