# API App

`apps/api` is the local MiniX backend used by the official `v1.0` sample apps.

It serves the current frozen sample surface:

- auth: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/me`
- host flow: `/items`
- novel flow: `/novels`, `/novels/detail`, `/chapters`, `/chapters/content`
- reader continuity: `/reading-progress`
- shelf and entitlement: `/bookshelf`, `/membership`, `/membership/purchase`

Local development:

```bash
pnpm dev:api
```

Cloudflare Worker development with local D1:

```bash
pnpm api:d1:migrate:local
pnpm dev:api:worker
```

Cloudflare config safety:

- the committed [`wrangler.jsonc`](/apps/api/wrangler.jsonc) file is a safe template
- real preview and production ids must live in the ignored `apps/api/wrangler.private.jsonc`
- the Wrangler scripts in the repo automatically prefer `wrangler.private.jsonc` when it exists
- initialize a private config with:

```bash
cp apps/api/wrangler.jsonc apps/api/wrangler.private.jsonc
```

Cloudflare authentication check before remote work:

```bash
pnpm api:whoami
```

Preview deploy path on `workers.dev`:

```bash
pnpm api:d1:migrate:preview
pnpm api:deploy:preview
```

Production deploy path on `workers.dev`:

```bash
pnpm api:d1:migrate:production
pnpm api:deploy:production
```

Official sample integration gate:

```bash
pnpm verify:official-integrations
```

Remote API verification after deploy:

```bash
MINIX_API_BASE_URL="https://<worker-url>.workers.dev" pnpm verify:api:remote
```

The local server listens on `http://localhost:3000` by default so `host-*` and `novel-*` can point at the same API without extra bootstrap overrides.

Official sample media is also served by the API itself:

- cover assets: `/sample-assets/covers/:assetId.svg`
- profile assets: `/sample-assets/profiles/:assetId.svg`

The sample content fixtures only reference these API-controlled asset paths, so release builds no longer depend on `example.com` placeholder media.

Local H5 browser origins allowed by default:

- `http://localhost:4173`
- `http://127.0.0.1:4173`
- `http://localhost:4174`
- `http://127.0.0.1:4174`

Add extra preview origins through `MINIX_CORS_ALLOWED_ORIGINS`, using a comma-separated list.

The committed Worker template now assumes these official H5 origins for remote release work:

- preview:
  - `https://preview.minix-host-h5.pages.dev`
  - `https://preview.minix-novel-h5.pages.dev`
- production:
  - `https://minix-host-h5.pages.dev`
  - `https://minix-novel-h5.pages.dev`

Auth abuse controls:

- `POST /auth/login` and `POST /auth/refresh` are throttled per client IP and platform
- the API prefers `CF-Connecting-IP`, then falls back to the first `X-Forwarded-For` hop, then uses `anonymous`
- throttled responses return `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
- default throttle window is `60` seconds
- default limits are `10` login attempts and `20` refresh attempts per window
- override the defaults with:
  - `MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS`
  - `MINIX_AUTH_LOGIN_MAX_ATTEMPTS`
  - `MINIX_AUTH_REFRESH_MAX_ATTEMPTS`
- for remote Cloudflare deployments, bind `AUTH_RATE_LIMIT_KV` so the throttling state survives across Worker isolates

Trace and debugging behavior:

- the API accepts a caller-provided `x-trace-id` header and echoes it back as `X-Trace-Id`
- when the caller does not provide one, the API generates a server trace id for the response
- auth rate-limit and auth failure logs include the trace id so remote `wrangler tail` output can be matched back to client-side failures
- `pnpm verify:api:remote` now checks that remote responses echo the same trace id

Implementation notes:

- Hono provides the HTTP surface.
- Zod validates request bodies and query strings.
- The API can run against the in-memory store for Node local development, or against D1 through the Worker binding path.
- the committed `wrangler.jsonc` keeps the `preview` and `production` environment shape, database names, and binding names, but not real remote ids
- real preview and production D1 or KV ids belong only in the ignored `wrangler.private.jsonc`
- Remote deploys currently target Cloudflare `workers.dev` domains. Use the URL emitted by `wrangler deploy` as the sample-app API base URL.
- Static sample catalog and chapter fixtures now live in `apps/api/src/content.ts`, separate from the route shaping logic in `apps/api/src/data.ts`.
- `apps/api/src/sample-assets.ts` owns the generated SVG covers and profile art used by the official sample payloads.
- Mutable sample user state is initialized lazily through `apps/api/src/seed.ts`, which means D1-backed environments do not need a separate content import step before the first login.
- CORS preflight and response headers are explicitly enabled for the local H5 sample origins so browser runtime requests can reach the API directly.
- Extra browser origins can now be provided through the Worker binding `MINIX_CORS_ALLOWED_ORIGINS`, which is required once H5 preview or production hosts move off localhost.
- Auth throttling uses in-memory counters in local Node development and can switch to Cloudflare KV through the `AUTH_RATE_LIMIT_KV` binding for remote environments.
- Phone-code auth now uses `/auth/verification-code/request` challenges with expiry and attempt limits. Local/sample runs use a simulated SMS provider and expose `delivery.debugCode` for tests instead of relying on a static global demo code.
- Password auth now uses stored hashed credentials created through `/auth/password/register` or `/auth/password/reset`, with failed-attempt lockout metadata returned through `credentialProtection`.
- OAuth auth now uses `/auth/oauth/authorize` state records and `/auth/oauth/callback` validation instead of returning a reserved/unsupported response for every provider.
- `apps/api/wrangler.jsonc` and `apps/api/migrations/` define the safe Worker + D1 template path for Cloudflare-oriented local development.
- Local development still uses the top-level `minix-api` binding with a placeholder local-only D1 id.
