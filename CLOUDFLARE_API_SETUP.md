# Cloudflare API setup

This branch adds a small Worker API while preserving the existing static site.

## Routes

- `GET /api/health` — non-sensitive health check
- `GET /api/products` — active products only
- `POST /api/applications` — validated public application submission

## Required Worker variables

Set these as encrypted production variables in Cloudflare Workers & Pages:

- `SUPABASE_URL=https://yduvwjrzhmmvjnrfyrsy.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>`

The publishable key is safe for client-facing use; never add a Supabase service-role key to this repository or browser code.

## Not included yet

- Turnstile validation
- Authenticated admin routes
- Order creation
- Payment webhooks
- Inventory mutation endpoints

Those require their own tested migrations and policies before release.
