# Cloudflare API setup

The existing `johnztrueorganics` deployment is a static-assets-only site. This branch intentionally deploys a separate runtime Worker named `johnztrueorganics-api`, so the live website remains unchanged while the API is tested.

## Deployment

Create a new Worker from this repository and branch:

- Repository: `housinhues/jm-true-organics`
- Branch: `feat/cloudflare-supabase-api`
- Worker name: `johnztrueorganics-api`
- Entry point: `worker.js`
- Configuration: `wrangler.jsonc`

After deployment, add encrypted production variables under **Settings → Variables and Secrets**:

- `SUPABASE_URL` = `https://yduvwjrzhmmvjnrfyrsy.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = the Supabase publishable key

Never add a Supabase service-role key to this Worker or repository.

## Routes

- `GET /api/health` — non-sensitive health check
- `GET /api/products` — active products only
- `POST /api/applications` — validated public application submission

The API Worker should initially receive a `workers.dev` URL for testing. Only after the endpoints pass testing should Cloudflare route `johnztrueorganics.org/api/*` to this Worker.

## Not included yet

Turnstile validation, authenticated admin routes, order creation, payment webhooks, and inventory mutations require their own tested migrations and policies before release.
