# Route Map

## Existing Routes

| Route | Purpose | Layout | Client/Server | Data Source | Status |
| --- | --- | --- | --- | --- | --- |
| `/` | Marketing home page | landing | mostly server with client carousel | static section content | Mostly complete |
| `/about` | Brand/about page | landing | server | static content | Partial |
| `/contact` | Contact + FAQ + map | landing | client page with client form | local form state only | Partial |
| `/services` | Service options + embedded store | landing | client-heavy | static options/products | Partial |
| `/auth/login` | Login screen | root | server | no auth integration | Partial |
| `/auth/register` | Register screen | root | server | no auth integration | Partial |
| `/admin` | Admin dashboard overview | admin dashboard | client | inline mock arrays | Partial |
| `/admin/customers` | Customer management | admin dashboard | client | inline mock arrays | Partial |
| `/admin/financials` | Revenue/transaction dashboard | admin dashboard | client | inline mock arrays | Partial |
| `/admin/order-confirmation` | Review service requests | admin dashboard | client | inline mock arrays | Partial |
| `/admin/orders` | Order management | admin dashboard | client | inline mock arrays | Partial |
| `/admin/profile` | Admin profile/settings | admin dashboard | client | local UI state only | Partial |
| `/admin/services` | Service catalog management | admin dashboard | client | inline mock arrays | Partial |
| `/admin/settings` | Legal/FAQ/contact/notification settings | admin dashboard | client | inline mock arrays + local state | Partial |
| `/admin/technicians` | Technician management | admin dashboard | client | inline mock arrays | Partial |
| `/user` | Customer overview dashboard | user dashboard | client | inline mock arrays | Partial |
| `/user/my-plans` | Billing/history view | user dashboard | client | inline mock arrays | Partial |
| `/user/notification` | Notification list | user dashboard | client | inline mock arrays | Partial |
| `/user/payments` | Payments/invoices | user dashboard | client | inline mock arrays | Partial |
| `/user/profile` | Customer profile/properties/sessions | user dashboard | client | inline mock arrays | Partial |
| `/user/services` | Service request history | user dashboard | client | inline mock arrays | Partial |

## Missing / Broken Routes

| Route | Finding | Status |
| --- | --- | --- |
| `/auth/forgot-password` | Linked from login page but route file does not exist | Broken |
| `/store` | No dedicated store route | Missing |
| `/cart` | No cart route | Missing |
| `/checkout` | No checkout route | Missing |
| product detail route | No route found for product details | Missing |

## Notes

- Production build generates 23 static pages including `/_not-found`.
- No route currently depends on backend data.
- No loading or error route files were found.
