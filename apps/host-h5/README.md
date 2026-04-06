# Host H5 App

This app is the H5 companion to the WeChat host.

It validates that the same kernel contracts can drive:

- home entry
- sign-in from home without leaving home
- overview dashboard after login
- protected plan requests
- preferences and logout

without using WeChat-specific APIs.

## Run It

Build the browser bundle from repo root:

```bash
pnpm build
```

Run watch mode with auto rebuild and a local preview server:

```bash
pnpm dev
```

This command keeps the watcher and static server running on `http://localhost:4173`.

Build and preview in one command:

```bash
pnpm preview
```

Then open:

```text
http://localhost:4173
```

## Cloudflare Pages

The official remote Pages project name is `minix-host-h5`.

URL convention:

- preview: `https://preview.minix-host-h5.pages.dev`
- production: `https://minix-host-h5.pages.dev`

Deploy commands from the repo root:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:host-h5:preview
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:host-h5:production
```

Deep-link fallback:

- the host ships `public/_redirects` with `/* /index.html 200`
- this keeps Cloudflare Pages refreshes and direct links to routes like `/overview` and `/preferences` inside the SPA instead of returning a static 404

Release headers and cache policy:

- the host ships `public/_headers` for the Pages deploy
- `index.html` is served with `Cache-Control: no-cache, no-store, must-revalidate`
- `/assets/*` is currently served with `Cache-Control: no-cache` because the bundle file names are still stable rather than fingerprinted
- release headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a narrow `Permissions-Policy`
- a strict CSP is intentionally not set yet because the current Pages build injects a small inline bootstrap script for `apiBaseUrl`

## Notes

- the build output is written to `apps/host-h5/dist`
- the H5 host now targets `http://localhost:3000` by default so it can validate against the local Hono API
- Pages deploys inject `window.__MINIX_BOOTSTRAP_ENV__.apiBaseUrl` into the built `index.html`, so the remote host does not fall back to `localhost:3000`
- add `?minix_use_mock=1` to the preview URL to force the local mock adapter
- set `window.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "...", useMock: true }` before bootstrap if you need an explicit runtime override
- `src/manifest/page-definitions.ts` is the editable host page source and should use the definition builders from `@minix/core`
- `src/manifest/app.manifest.ts` is a generated runtime assembly file derived from `page-definitions.ts`
- `src/manifest/page-manifest.ts` declares route paths and `renderMode`
- `src/render/page-registry.ts` owns route-to-renderer resolution and exports custom renderer metadata
- `src/render/main.ts` only bootstraps the runtime and sync loop
- the local mock adapter remains available for demo-only validation when the Hono backend is not running
- `pnpm dev` keeps running until you stop it
