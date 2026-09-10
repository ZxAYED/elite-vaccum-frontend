# AI_FRONTEND_MAP.md

Token-optimized architecture guide for AI coding agents.

---

## 1. Routing & Layout Hierarchy

### Root & Nested Layouts
- `app/layout.tsx`: Root document (`<html>`, `<body>`, `<ReduxProvider>`, `<Toaster>`).
- `app/(landingPage)/layout.tsx`: Public storefront wrapper (`Navbar`, `Footer`, `<main className="min-h-screen">`).
- `app/(dashboard)/admin/layout.tsx`: Admin console (`AdminSidebar`, `AdminHeader`, role-guarded `RoleGate`).
- `app/(dashboard)/technician/layout.tsx`: Technician mobile-first portal (`TechnicianHeader`, `TechnicianDashboardSidebar`, `TechnicianBottomNav`).
- `app/(dashboard)/user/layout.tsx`: Customer dashboard (`UserDashboardSidebar`, `UserHeader`).
- `app/auth/`: Unwrapped stand-alone layout (`AuthLayout` with branding sidecard).

### Route Segments Map
- **Public `(landingPage)`**: `/` (Home), `/store` (Catalog), `/store/[slug]` (PDP), `/services` (Service list), `/services/[slug]` (Service detail), `/services/request` (Wizard), `/cart`, `/checkout`, `/checkout/success`, `/about`, `/contact`, `/privacy`, `/terms`, `/accessibility`.
- **Auth `auth/`**: `/auth/login`, `/auth/register`, `/auth/forgot-password`.
- **User Dashboard `(dashboard)/user/`**: `/user` (Overview), `/user/orders`, `/user/orders/[orderId]`, `/user/services`, `/user/services/[requestId]`, `/user/services/[requestId]/quotation`, `/user/quotations`, `/user/quotations/[requestId]`, `/user/schedule`, `/user/schedule/[requestId]`, `/user/billing`, `/user/billing/invoices/[invoiceId]`, `/user/payments`, `/user/my-plans`, `/user/notifications`, `/user/reviews`, `/user/profile`, `/user/settings`.
- **Technician Portal `(dashboard)/technician/`**: `/technician` (Overview), `/technician/jobs`, `/technician/jobs/[serviceOrderId]`, `/technician/schedule`, `/technician/notifications`, `/technician/profile`, `/technician/settings`.
- **Admin Portal `(dashboard)/admin/`**: `/admin` (Analytics), `/admin/orders`, `/admin/orders/[orderId]`, `/admin/products`, `/admin/products/new`, `/admin/products/[productId]/edit`, `/admin/categories`, `/admin/quotations`, `/admin/quotations/new`, `/admin/quotations/[quotationId]`, `/admin/service-requests`, `/admin/service-requests/[requestId]`, `/admin/schedule`, `/admin/customers`, `/admin/customers/[customerId]`, `/admin/technicians`, `/admin/technicians/[technicianId]`, `/admin/financials`, `/admin/financials/invoices/[invoiceId]`, `/admin/reports`, `/admin/reviews`, `/admin/notifications`, `/admin/settings`, `/admin/profile`.

---

## 2. Page-to-Component Inventory

| Route / Page File | Screen Purpose | Child / Section Components | Modals & Dialogs Used |
| :--- | :--- | :--- | :--- |
| `app/(landingPage)/page.tsx` | Marketing homepage | `HeroSection`, `TrustSignalsBar`, `FeaturedProductsSection`, `ServicesSection`, `WhyChooseUsSection`, `TestimonialsCarousel`, `HomeCTA` | `CartExperience` (Slideout drawer) |
| `app/(landingPage)/store/page.tsx` | Product store catalog | `StoreCatalog`, `ProductCard`, `CatalogFilters`, `ProductSortSelect`, `Pagination` | Quick View Modal, Cart Drawer |
| `app/(landingPage)/store/[slug]/page.tsx` | Product details (PDP) | `ProductDetailExperience`, `ProductDetailView`, `ProductGallery`, `ProductDetailTabs`, `ProductSection` | Review Submission Modal, Image Lightbox |
| `app/(landingPage)/cart/page.tsx` | Full cart review | `CartExperience`, `CartItemRow`, `OrderTotals`, `EmptyCartState` | Remove Item Confirmation Dialog |
| `app/(landingPage)/checkout/page.tsx` | Checkout & payment | `CheckoutExperience`, `ShippingAddressForm`, `StripePaymentForm`, `OrderSummaryPanel` | OneClickLoginModal, Address Modal |
| `app/(landingPage)/checkout/success/page.tsx` | Order confirmation | `CheckoutSuccessCartReset`, `OrderConfirmationReceipt`, `RecommendedNextSteps` | None |
| `app/(landingPage)/services/page.tsx` | Professional service catalog | `ServicesCatalog`, `ServiceCard`, `ServiceCategoryTabs`, `ServiceGuarantee` | Service Inquiry Modal |
| `app/(landingPage)/services/[slug]/page.tsx` | Service detail page | `ServiceHero`, `ServiceInclusions`, `ServicePricingTier`, `ServiceFAQ`, `RelatedServices` | Quote Request Slideout |
| `app/(landingPage)/services/request/page.tsx` | Multi-step booking wizard | `ServiceRequestForm`, `StepIndicator`, `ServicePicker`, `PropertyDetailsStep`, `DateTimeSlotPicker` | Booking Cancel Confirmation |
| `app/auth/login/page.tsx` | User / staff login | `LoginForm`, `AuthCard`, `SocialLoginGroup`, `OneClickLoginModal` | Demo Credential Picker Modal |
| `app/auth/register/page.tsx` | Customer registration | `RegisterForm`, `AuthCard`, `PasswordStrengthMeter` | Terms of Service Modal |
| `app/auth/forgot-password/page.tsx` | Password reset link | `ForgotPasswordForm`, `AuthCard` | None |
| `app/(dashboard)/user/page.tsx` | Customer portal overview | `UserOverviewClient`, `UpcomingServicesCard`, `RecentOrdersCard`, `QuickBookBanner` | Reschedule Service Dialog |
| `app/(dashboard)/user/orders/page.tsx` | Customer orders list | `UserOrdersClient`, `OrderFilterTabs`, `OrderHistoryRow`, `StatusBadge` | Cancel Order Dialog |
| `app/(dashboard)/user/orders/[orderId]/page.tsx` | Customer product-order detail, tracking, invoice & post-delivery reviews | `UserOrderDetailClient`, `OrderItems`, `ProductReviewSection`, `ProductReviewComposer`, `OrderInvoiceCard`, `StatusBadge` | Cancel Order Dialog, Request Return Dialog |
| `app/(dashboard)/user/services/page.tsx` | Customer booked services | `UserServicesClient`, `ServiceRequestTable`, `ServiceStatusBadge` | Cancel Request Dialog |
| `app/(dashboard)/user/quotations/page.tsx` | Customer quotation proposals | `UserQuotationsClient`, `QuoteActionPanel`, `QuotationStatusBadge` | Accept / Reject Quote Modal |
| `app/(dashboard)/user/schedule/page.tsx` | Customer appointments calendar | `UserScheduleClient`, `AppointmentCard`, `CalendarTimeline` | Reschedule Appointment Modal |
| `app/(dashboard)/user/schedule/[requestId]/page.tsx` | Appointment detail | `UserScheduleDetailClient`, `TechnicianInfoCard`, `LocationMapCard` | Reschedule / Cancel Modal |
| `app/(dashboard)/user/billing/page.tsx` | Customer invoices & billing | `UserBillingClient`, `InvoiceHistoryTable`, `SavedPaymentMethodsCard` | Add Payment Card Dialog |
| `app/(dashboard)/technician/page.tsx` | Technician daily dashboard | `TechnicianOverviewClient`, `DailyJobMetricsCard`, `NextJobCard`, `RouteMapCard` | Check-in / Status Dialog |
| `app/(dashboard)/technician/jobs/page.tsx` | Technician assigned work orders | `TechnicianJobsClient`, `JobFilterTabs`, `JobTicketCard` | Decline Job Modal |
| `app/(dashboard)/technician/jobs/[serviceOrderId]/page.tsx` | Work order execution | `TechnicianJobDetailClient`, `JobStatusStepper`, `WorkChecklist`, `PartsUsedList`, `CustomerSignaturePad` | Complete Job & Invoice Modal |
| `app/(dashboard)/admin/orders/page.tsx` | Admin global order management | `AdminOrdersClient`, `OrdersDataTable`, `OrderBatchActions`, `OrderFilters` | Bulk Status Update Modal |
| `app/(dashboard)/admin/orders/[orderId]/page.tsx` | Admin product-order detail: status, tracking, invoice, refunds | `AdminOrderDetailClient`, `OrderInvoiceCard`, `StatusBadge` | Cancel Order Dialog, Approve Refund Dialog |
| `app/(dashboard)/admin/products/page.tsx` | Admin product inventory | `AdminProductsClient`, `ProductTable`, `StockStatusBadge`, `CategoryFilter` | Delete Product Confirmation |
| `app/(dashboard)/admin/products/new/page.tsx` | Product creation wizard | `AdminProductForm`, `ImageUploadDropzone`, `PricingTierInput`, `VariantsEditor` | Unsaved Changes Modal |
| `app/(dashboard)/admin/products/[productId]/edit/page.tsx` | Product edit form | `AdminProductForm`, `ImageUploadDropzone`, `StockAdjuster` | Delete Product Confirmation |
| `app/(dashboard)/admin/quotations/page.tsx` | Admin quotations pipeline | `AdminQuotationsClient`, `QuotationPipelineBoard`, `QuotationTable` | Send Quote Email Dialog |
| `app/(dashboard)/admin/service-requests/page.tsx` | Service requests triage | `AdminServiceRequestsClient`, `ServiceRequestTable`, `TechnicianAssignDropdown` | Dispatch Technician Modal |

---

## 3. API Integration & Data Fetching Layer

All endpoints extend `baseApi.ts` using Redux Toolkit Query (`createApi`) with automatic cache tagging and invalidation.

| Feature / Domain | API Service / Hook File | Endpoint / Method | Query / Mutation Keys & Tags | Consuming Component | TypeScript Types File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `redux/api/authApi.ts` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout` | `Auth` | `LoginForm`, `RegisterForm`, `Navbar` | `types/domain.ts` |
| **Products** | `redux/api/productsApi.ts` | `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` | `Product`, `ProductsList` | `StoreCatalog`, `ProductDetailExperience`, `AdminProductsClient`, `AdminProductForm` | `types/domain.ts` |
| **Categories** | `redux/api/categoriesApi.ts` | `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` | `Category` | `StoreCatalog`, `AdminProductForm`, `CategoriesClient` | `types/domain.ts` |
| **Store Orders** (products only) | `redux/api/ordersApi.ts` | `POST /store/orders`, `GET /store/orders`, `GET /store/orders/admin/list`, `GET /store/orders/:id`, `PATCH /store/orders/:id/cancel`, `PATCH /store/orders/:id/status`, `GET /store/orders/checkout/session/:orderId`, `POST`/`GET /store/returns/orders/:orderId`, `PATCH .../refund` | `Order`, `Return` | `CheckoutExperience`, `CheckoutPaymentStatus`, `UserOrdersClient`, `UserOrderDetailClient`, `AdminOrdersClient`, `AdminOrderDetailClient` | `redux/api/ordersApi.ts` (self-contained DTOs) |
| **Store Invoices** (order PDFs) | `redux/api/storeInvoicesApi.ts` | `GET /store/invoices/orders/:orderId`, `POST .../generate`, `GET .../download` | `Invoice` | `OrderInvoiceCard` (customer + admin order detail) | `redux/api/storeInvoicesApi.ts` |
| **Cart** | `redux/api/cartApi.ts` | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | `Cart` | `CartExperience`, `CartItemRow`, `useCartSync` | `types/domain.ts` |
| **Services** | `redux/api/servicesApi.ts` | `GET /services`, `GET /services/:slug`, `POST /services`, `PATCH /services/:id` | `Service` | `ServicesCatalog`, `ServiceDetailExperience`, `AdminServicesClient` | `types/domain.ts` |
| **Service Requests** | `redux/api/serviceRequestsApi.ts` | `GET /service-requests`, `POST /service-requests`, `PATCH /service-requests/:id/status` | `ServiceRequest` | `ServiceRequestForm`, `UserServicesClient`, `AdminServiceRequestsClient` | `types/domain.ts`, `types/customer-portal.ts` |
| **Quotations** | `redux/api/quotationsApi.ts` | `GET /quotations`, `GET /quotations/:id`, `POST /quotations`, `PATCH /quotations/:id/accept` | `Quotation` | `QuoteActionPanel`, `UserQuotationsClient`, `AdminQuotationsClient` | `types/domain.ts` |
| **Technician** | `redux/api/technicianApi.ts` | `GET /technician/jobs`, `GET /technician/jobs/:id`, `PATCH /technician/jobs/:id/status` | `TechnicianJob`, `TechnicianSchedule` | `TechnicianOverviewClient`, `TechnicianJobsClient`, `TechnicianJobDetailClient` | `types/domain.ts` |
| **Billing & Invoices** (universal) | `redux/api/billingApi.ts` | `GET /billing/invoices` (+KPIs), `GET /billing/invoices/me`, `GET /billing/invoices/:id`, `GET /billing/invoices/:id/html`, `POST /billing/invoices`, `PATCH /billing/invoices/:id`, `POST /billing/invoices/:id/payments`, `POST /billing/invoices/:id/refunds`, `POST /billing/invoices/:id/stripe/payment-intent`, `POST .../stripe/confirm` | `Invoice`, `Payment` | `UserBillingClient`, `UserInvoiceDetailClient`, `AdminFinancialsClient`, `AdminInvoiceDetailClient` | `redux/api/billingApi.ts` |
| **Customer Addresses**| `redux/api/addressesApi.ts` | `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id` | `Address` | `ShippingAddressForm`, `UserProfileClient` | `types/domain.ts` |
| **Reviews** | `redux/api/reviewsApi.ts` | `GET /reviews` (public), `GET /reviews/me`, `GET /reviews/me/products`, `GET /reviews/products/:productId/me`, `POST /reviews`, `GET /reviews/admin/all`, `PATCH /reviews/:id/moderate`, `DELETE /reviews/:id` | `Review` | `ProductDetailTabs`, `ReviewsExperience`, `UserOrderDetailClient`, `AdminReviewsClient` | `types/domain.ts`, `redux/api/reviewsApi.ts` |
| **Admin Dashboard** | `redux/api/dashboardApi.ts` | `GET /dashboard` (no params, 60s cache) | `Dashboard` | `app/(dashboard)/admin/page.tsx` | `redux/api/dashboardApi.ts` |
| **Reports** | `redux/api/reportsApi.ts` | `GET /reports/overview` (period, from/to, orderType), `/reports/sales`, `/reports/service-operations` (period, from/to), `/reports/technicians` and `/reports/customers` (**no params**), `GET /reports/export/{orders,service-requests,invoices,customers}/csv` | `Report` | `AdminReportsClient`, `ExportReportMenu` | `redux/api/reportsApi.ts` |
| **Notifications** | `redux/api/notificationsApi.ts` | `GET /notifications`, `GET /notifications/unread-count`, `GET`/`PATCH /notifications/preferences`, `POST /notifications` (admin, **one recipient**), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id` | `Notification` | `UserNotificationsClient`, `AdminNotificationsPage`, `AdminEnqueueNotificationModal`, `Navbar` | `types/domain.ts`, `redux/api/notificationsApi.ts` |

---

## 4. State Management & Design System Assets

### Global Store Slices (`redux/store.ts`)
Mounted via `<ReduxProvider>` in `app/layout.tsx`:
- `auth`: (`redux/slices/authSlice.ts`) Current user session, token, active role (`customer`, `technician`, `admin`).
- `cart`: (`redux/slices/cartSlice.ts`) Local-first items, quantity, persistent drawer state (synced with `cartApi` via `useCartSync`).
- `ui`: (`redux/slices/uiSlice.ts`) Sidebar toggle, mobile navigation visibility, active modals, global banners.
- `chat`: (`redux/slices/chatSlice.ts`) Support chat drawer state, active conversation ID.
- `baseApi.reducer`: RTK-Query cache store mounting all endpoints under `baseApi.reducerPath`.

### Shared UI Components & Primitives (`components/ui/`)
Built with Radix UI primitives, Lucide icons, and Tailwind tokens (Elite Teal: `#0f766e` / `#0d9488`, Slate neutrals):
- **Core Primitives**: `Button.tsx`, `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`, `Switch.tsx`.
- **Feedback & Overlay**: `Dialog.tsx`, `Sheet.tsx` (slideout drawer), `DropdownMenu.tsx`, `Tooltip.tsx`, `Toaster.tsx` (Sonner), `Alert.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `PageStateShell.tsx`.
- **Data Display & Layout**: `Card.tsx`, `Badge.tsx`, `Table.tsx`, `Tabs.tsx`, `Carousel.tsx`, `Separator.tsx`, `Accordion.tsx`.

### Reporting Caveats (read before editing the dashboard or reports)

- `/dashboard` is one request backing every card, chart and list on the admin
  overview. `revenueTrend` is always exactly 6 pre-seeded monthly buckets, so
  empty months plot as 0. `serviceDistribution.percentage` is server-computed —
  never recompute it.
- `/reports/overview` mixes scopes: **revenue** honours the selected range, but
  the count metrics are **lifetime totals**, and `revenueOverTime` is a fixed
  **14 daily points** that ignores the range entirely. The UI labels all three
  explicitly; don't relabel them as range-scoped. For a monthly series use
  `/dashboard`'s `revenueTrend`.
- `orderType` is accepted by `/reports/overview` only.
- `/reports/technicians` and `/reports/customers` take **no parameters**, so the
  reports screen hides the range selector on those tabs rather than showing a
  filter that does nothing. `/reports/technicians` returns a **bare array**.
- There is no payments-list, refunds-list or report `search` endpoint. Those
  views are derived from data already loaded.
- CSV exports are server-generated `text/csv` attachments and are authenticated
  — fetch as a blob via `saveBlobAsFile`, never a plain link (a new tab drops the
  bearer token and 401s). Same rule as invoice PDFs and printable HTML.

### Customer Portal Design System (`components/customer-portal/PortalUI.tsx`)

**Every `/user/*` list screen is built from these. Do not hand-roll a card,
filter row, loading block or action button in the portal — reuse or extend
these, or the screens drift apart again.**

| Component | Use |
| :--- | :--- |
| `PortalFilterBar` | Filter pills (+ optional counts) and the search box. Accepts `filterLabel`, `trailing`. |
| `PortalCard` | The record card shell: border, radius, padding, hover. |
| `PortalCardTop` | Badge row left, timestamp/meta right. |
| `PortalCardTitle` | The headline — always `text-primary`, never near-black. Optional `subtitle`, `href`. |
| `PortalRef` | Mono reference chip (order / invoice number). |
| `PortalFact` | Icon chip + uppercase micro-label + value. Renders a muted placeholder when the value is missing. |
| `PortalCardFooter` | Facts left, actions right, above a hairline divider. |
| `PortalDetailAction` | The canonical "View Details" button. |
| `PortalCardAction` | Secondary action (Print / Pay / Review) with `tone`: `neutral` \| `brand` \| `accent`. |
| `PortalLoading` | Standard spinner block. |
| `PortalList` | List wrapper; dims on background refetch via `isRefreshing`. |
| `PortalPager` | Server-pagination controls. |

Rules the kit encodes:
- Titles are brand-coloured; body copy is slate. A bold near-black title is a bug.
- Missing data shows an italic placeholder (`Not dispatched yet`), never a blank gap.
- Action order is low to high emphasis, left to right, so the primary call sits rightmost.
- Every card button is `size="sm"` and `rounded-md`; filter pills are `h-9`.
- Empty / error states use `EmptyState` with `tone="card"`.

Screens on the kit: `UserServicesClient`, `UserOrdersClient`, `UserBillingClient`,
`UserScheduleClient`, `ReviewsExperience`, `user/quotations/page.tsx`,
`user/notifications/page.tsx`.

### Notification Caveats

- `type` is a **server enum**, exported as `NOTIFICATION_TYPES` /
  `NOTIFICATION_TYPE_LABELS` from `notificationsApi.ts`:
  `SERVICE_REQUEST_UPDATE`, `QUOTATION_UPDATE`, `SCHEDULE_DISPATCH`,
  `ORDER_STATUS_UPDATE`, `BILLING_INVOICE`, `REVIEW_MODERATION`,
  `SYSTEM_ALERT`. Import those constants — inventing slugs like `"system"` or
  `"service-update"` gets a 400 on write and silently matches nothing on read.
- `POST /notifications` requires `userId` + `type` + `title` + `message`, and
  `userId` must be the **User UUID — not a `customerId`** (a customer profile id
  passes validation and then fails recipient lookup server-side).
- There is **no role broadcast and no bulk endpoint**. Multi-recipient sends fan
  out client-side, one POST per id, via `Promise.allSettled` so partial failures
  are reported and the failed ids stay in the form for retry. A backend
  `POST /notifications/bulk` would replace this.
- Optional fields the API accepts but the dispatch modal does not yet collect:
  `ctaUrl` (max 255), `metadata`, `sendEmail`, `priority` (1 highest, 10 normal,
  default 5). `title` caps at 200.
- When fanning out mutations in parallel, do not drive the busy state from the
  hook's `isLoading` — it tracks only the most recent trigger. Use a local flag.

### Review Caveats (Phase 13)

- Reviews are keyed **per product, not per order line**. `POST /reviews` takes
  `productId` + `productOrderId`, but a customer gets one review per product —
  so a product reviewed on an earlier order shows as already-reviewed on this
  order too. That is the API's rule, not a bug to route around.
- The customer-facing review UI lives **on the order detail page**
  (`ProductReviewSection` in `UserOrderDetailClient`), gated on order status
  `DELIVERED` / `COMPLETED`. `/user/reviews` is the standalone hub and also
  accepts `?compose=product|service&orderId=…`.
- Existing-review lookup reads `GET /reviews/me/products` (13.2), which returns
  the product and order each review belongs to. `GET /reviews/me` is a fallback
  and its `relatedEntityId` field is **unverified against the live API** — do not
  make it the only source.
- `GET /reviews` live returns `{ success, items, meta.analytics: { averageRating,
  totalReviews } }` — **not** the `ratingSummary` object the integration guide
  documents in 13.1. `unwrapPublicReviews` currently ignores `meta.analytics` and
  recomputes the average from the current page of items, which is wrong once the
  feed paginates. Fix by reading `meta.analytics` when present.
- Order status arrives in mixed case from some endpoints; `normalizeStoreOrder`
  uppercases it. Never compare a raw API status against `"DELIVERED"` directly.

### Whole-Page States (not found / error / loading)

`components/ui/PageStateShell.tsx` centres a **whole-page** fallback in every
role's dashboard. Any `if (!record) return …` / `if (isError) return …` /
full-page spinner in a detail route must be wrapped in it — a dashboard
`<main>` passes no height through `DashboardPageTransition`, so a bare card
sticks to the top of the content area instead of sitting in the middle.

```tsx
<PageStateShell header={<PageHeader … />} width="md">
  <EmptyState title="Order not found" … tone="card" />
</PageStateShell>
```

- `header` pins a page header or back link to the top; the child block is
  centred in the remaining space. Omit it for a plain centred card.
- `width`: `sm` | `md` (default) | `lg` | `full`.
- Do **not** also put `py-14`, `py-16`, `py-24` or `min-h-screen` on the child —
  that padding was faking vertical placement and now just off-centres it.
- `app/not-found.tsx` is the styled, viewport-centred 404 behind every
  `notFound()` call (e.g. `/admin/service-requests/[requestId]`,
  `/admin/products/[productId]/edit`).
- Skeletons that mirror the real page layout (e.g. the service-request detail
  skeleton) stay top-anchored — only single-block states get centred.

### Cross-Cutting Helpers
- `lib/api-error.ts`: `readApiMessage(err, fallback)` surfaces the message the API itself returned (handles NestJS array messages).
- `lib/download-file.ts`: `saveBlobAsFile` / `invoiceFileName`, for authenticated binary downloads that cannot be a plain link.
- `lib/customer-orders.ts`: `buildProductTimeline`, `toStatusSlug` (maps `OUT_FOR_DELIVERY` to `out-for-delivery` for `StatusBadge`).
- `lib/store.ts`: cart-side pricing mirror only. Shipping is a flat $18 once per order, tax 8%; real order figures are server-authoritative.
- `hooks/useDebouncedValue.ts`: defers search input so list filters run server-side without a request per keystroke.

> **Scope rule:** `/store/orders` is **product orders only**. Service work is a
> service request to quotation to service order chain under `/admin/service-requests`
> and `/user/services`. Never merge the two into one unified orders list.

### Validation Schemas (`lib/validation.ts` - Zod + React Hook Form)
- **Auth**: `loginSchema`, `registerSchema`, `forgotPasswordSchema`.
- **Checkout**: `shippingAddressSchema`, `paymentMethodSchema`, `guestCheckoutSchema`.
- **Services**: `serviceRequestStep1Schema`, `serviceRequestStep2Schema`, `serviceRequestScheduleSchema`.
- **Admin**: `productFormSchema`, `categoryFormSchema`, `quotationFormSchema`, `technicianAssignmentSchema`.
- **Customer**: `reviewFormSchema`, `profileUpdateSchema`, `contactSchema`.
