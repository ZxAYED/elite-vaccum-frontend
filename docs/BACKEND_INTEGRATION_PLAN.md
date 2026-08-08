# Backend Integration Plan

## Priority Resources

- `auth`
- `users`
- `customers`
- `properties`
- `products`
- `categories`
- `serviceRequests`
- `quotes`
- `appointments`
- `technicians`
- `orders`
- `payments`
- `notifications`
- `uploads`

## Frontend Contracts Needed

### Auth

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/session`

### Commerce

- `GET /products`
- `GET /products/:slug`
- `GET /categories`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `POST /checkout`

### Service Flow

- `POST /service-requests`
- `POST /service-requests/:id/uploads`
- `GET /service-requests`
- `GET /service-requests/:id`
- `POST /service-requests/:id/quote-acceptance`
- `POST /appointments`
- `GET /technicians/availability`

### Admin

- `GET /admin/dashboard`
- `GET /admin/customers`
- `GET /admin/orders`
- `GET /admin/services`
- `GET /admin/financials`
- `GET /admin/technicians`
- `PATCH /admin/settings/*`

## Recommended Frontend Refactor Boundary

- Move mock arrays into dedicated `mock/` or `data/` modules first.
- Introduce typed resource interfaces before adding network code.
- Add a thin API client layer only after backend routes are agreed.
- Keep route pages focused on rendering; move future fetch logic into server-side loaders or dedicated data functions.
