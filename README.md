# Our Home — API (Server)

## What This Does
REST API for the Our Home storefront: serves products and categories, handles
image uploads to Cloudinary, and creates Stripe Checkout sessions.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- Cloudinary (image storage) via Multer
- Stripe (payments)

## Prerequisites
- Node.js 18+
- A MongoDB database (e.g. Atlas)
- Cloudinary and Stripe accounts

## Setup
1. `cp .env.example .env` and fill in the values
2. `npm install`
3. `npm run dev` — runs on http://localhost:5000 (nodemon)

## Environment Variables
| Variable | Description |
|----------|-------------|
| `PORT` | Port to listen on (default 5000) |
| `CLIENT_URL` | Frontend origin — **CORS is restricted to this** |
| `DB_URL` | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_`) — server only |
| `ADMIN_API_KEY` | Required for all write routes (see below) |

## Authentication
Read routes (`GET`) are public. **Write routes** — `POST/PUT/DELETE` on
`/api/products` and `/api/categories` — require an admin key sent as the
`x-admin-key` header, compared against `ADMIN_API_KEY`.

Generate a key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example write request:
```bash
curl -X DELETE https://your-api/api/products/<id> \
  -H "x-admin-key: <your ADMIN_API_KEY>"
```

> If `ADMIN_API_KEY` is unset the server fails closed — all writes return 500.

## API Overview
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | public | All products |
| GET | `/api/products/products?slug=` | public | Product by slug |
| GET | `/api/products/products/:slug` | public | Product + related |
| GET | `/api/products/featured` | public | Featured (paginated) |
| GET | `/api/products/search?name=` | public | Search by name |
| POST/PUT/DELETE | `/api/products[/:id]` | admin | Create/update/delete product |
| GET | `/api/categories` | public | All categories |
| GET | `/api/categories/:id` | public | Category by id |
| GET | `/api/categories/categories/:slug` | public | Products in a category |
| POST/PUT/DELETE | `/api/categories[/:id]` | admin | Create/update/delete category |
| POST | `/api/orders` | public | Create Stripe Checkout session |

## Pricing & Checkout
`POST /api/orders` ignores any prices sent by the client. It looks each product up
by `_id` and uses the database price and a clamped quantity — clients cannot
manipulate the amount charged.
