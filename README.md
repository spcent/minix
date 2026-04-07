# MiniX

MiniX is a small, agent-friendly mini app kernel for WeChat Mini Program and H5.

`v0.1` is intentionally narrow. It proves one shared product path across two hosts:

`login -> /auth/login -> protected /items -> settings -> logout`

MiniX is not a full cross-platform framework yet. The goal is to keep shared contracts, runtime boundaries, and host wiring explicit enough that an agent can change the system safely.

## Release Status

The repository is still moving from `v0.1` into `v1.0`.

Release naming is now frozen:

- release-candidate notes should use `v1.0.0-rc.N`
- the final public tag should be `v1.0.0`
- the coordinated version bump from tracked `0.1.0` manifests and runtime stamps to `1.0.0` should happen only in the final release commit
- [`CHANGELOG.md`](/CHANGELOG.md) is the human-readable release note source of truth
- [`docs/RELEASE_NOTES_TEMPLATE.md`](/docs/RELEASE_NOTES_TEMPLATE.md) is the required outline for RC and final announcements

The frozen `v1.0` support surface is:

- `apps/host-h5`: official H5 sample for the shared learning flow
- `apps/host-wechat`: official WeChat sample for the shared learning flow
- `apps/novel-h5`: official H5 sample for the richer novel product line
- `apps/novel-wechat`: official WeChat sample for the richer novel product line

The current release-readiness milestone is to make all four apps defensible as official samples without widening MiniX into a full cross-platform rendering framework.

## Workspace

- `apps/host-wechat`: runnable WeChat Mini Program host
- `apps/host-h5`: runnable browser host for the same shared flow
- `apps/novel-wechat`: standalone WeChat Mini Program host for the novel demo
- `apps/novel-h5`: standalone browser host for the novel demo
- `packages/contracts`: route ids and backend-facing contract types
- `packages/core`: shared ports, runtime orchestration, store, and base types
- `packages/features/*`: reusable feature logic such as auth, items, and settings
- `packages/platform-wechat`: WeChat adapters and bridge code
- `packages/platform-h5`: H5 adapters
- `packages/tooling`: feature and host-page scaffolding scripts
- `packages/testkit`: shared test helpers

## Current State vs v1.0 Target

- `v0.1` currently proves the narrow shared flow `login -> /auth/login -> protected /items -> settings -> logout`
- the novel apps already exercise a wider sample surface for catalog, reader, bookshelf, and membership flows
- `v1.0` will officially support both the narrow shared hosts and the richer novel sample hosts
- `v1.0` does not promise new platform targets, a unified view DSL, or broad platform capability abstraction beyond the release-frozen runtime surface

## Quick Start

Install dependencies from the repo root:

```bash
pnpm install
```

Run the main verification gate:

```bash
pnpm verify
```

Start the local Hono API used by all four official sample apps:

```bash
pnpm dev:api
```

The API explicitly allows local H5 browser origins on `http://localhost:4173` and `http://localhost:4174`, including `127.0.0.1` variants. Add extra preview origins with `MINIX_CORS_ALLOWED_ORIGINS`.

Official sample media is served by the API itself under `/sample-assets/covers/:assetId.svg` and `/sample-assets/profiles/:assetId.svg`, so the release samples no longer depend on placeholder external asset hosts.

The API also rate limits `POST /auth/login` and `POST /auth/refresh` per client IP and platform. The default window is `60` seconds with `10` login attempts and `20` refresh attempts. The preview and production Worker configs bind `AUTH_RATE_LIMIT_KV` so those counters persist across isolates.

Run the Cloudflare Worker + local D1 version of the API:

```bash
pnpm api:d1:migrate:local
pnpm dev:api:worker
```

Deploy the API to Cloudflare `workers.dev`:

```bash
pnpm api:whoami
pnpm api:d1:migrate:preview
pnpm api:deploy:preview
```

Deploy the official H5 samples to Cloudflare Pages preview with the preview API URL injected at build time:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:host-h5:preview
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:novel-h5:preview
```

Expected preview host URLs:

- `https://preview.minix-host-h5.pages.dev`
- `https://preview.minix-novel-h5.pages.dev`

Promote the same API to production:

```bash
pnpm api:d1:migrate:production
pnpm api:deploy:production
```

The committed [`apps/api/wrangler.jsonc`](/apps/api/wrangler.jsonc) file is now a safe template. Put real preview and production Cloudflare ids only in the ignored `apps/api/wrangler.private.jsonc`.

Deploy the official H5 samples to Cloudflare Pages production with the production API URL injected at build time:

```bash
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:host-h5:production
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:novel-h5:production
```

Expected production host URLs:

- `https://minix-host-h5.pages.dev`
- `https://minix-novel-h5.pages.dev`

Both H5 samples also ship a Cloudflare Pages SPA fallback file, `public/_redirects`, so route refreshes and deep links continue to resolve through `index.html`.
They also ship `public/_headers` with a minimal release policy: `index.html` is non-cacheable, `/assets/*` is `no-cache`, and the Pages response includes basic browser hardening headers without enabling a strict CSP yet.

Run the frozen `v1.0` release gate across all four official samples:

```bash
pnpm exec playwright install chromium
pnpm verify:release
```

The operator checklist for RC promotion, manual WeChat validation, rollback, and hotfix flow is in [docs/RELEASE_RUNBOOK.md](docs/RELEASE_RUNBOOK.md).
Use [CHANGELOG.md](/CHANGELOG.md) plus [docs/RELEASE_NOTES_TEMPLATE.md](/docs/RELEASE_NOTES_TEMPLATE.md) when recording RC notes or the final `v1.0.0` announcement.
Record executed release evidence in [docs/VERIFICATION_LOG.md](docs/VERIFICATION_LOG.md) so preview proof, remote URLs, and manual WeChat validation do not live only in terminal history.
Reference GitHub Actions YAML files are archived under [docs/workflows](docs/workflows/README.md) and are not active under `.github/workflows/`.

Run the browser-level H5 release smoke only:

```bash
pnpm exec playwright install chromium
pnpm verify:h5:blackbox
```

Run the preview promotion proof against remote preview URLs:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" \
MINIX_HOST_H5_BASE_URL="https://preview.minix-host-h5.pages.dev" \
MINIX_NOVEL_H5_BASE_URL="https://preview.minix-novel-h5.pages.dev" \
pnpm verify:preview:remote
```

Run a real local API smoke against the official sample surface:

```bash
pnpm smoke:official-samples
```

Run the browser host:

```bash
pnpm dev
```

Open `http://localhost:4173`.

Run the novel browser host:

```bash
pnpm dev:novel-h5
```

Open `http://localhost:4174`.

For WeChat, import [`apps/host-wechat`](apps/host-wechat) into WeChat DevTools and keep `miniprogramRoot` set to `miniprogram/`.
For the novel Mini Program shell, import [`apps/novel-wechat`](apps/novel-wechat) instead.

For real WeChat release validation, each official Mini Program now expects its own ignored `project.private.config.json` derived from the checked-in example file. Keep real `appId` values and local DevTools-only settings in those ignored files rather than in tracked source.

## Common Commands

```bash
pnpm verify
pnpm dev:api
pnpm verify:api
pnpm smoke:official-samples
pnpm verify:release
pnpm build
pnpm dev
pnpm preview
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:shells
```

`workspace` is the shared starter template for upload-style and share-style capability features; keep using it instead of adding separate scaffold template names unless the generated surface truly diverges.

`verify` expands to:

```bash
node --import tsx scripts/check-specs.mjs
node scripts/check-boundaries.mjs
node scripts/check-package-deps.mjs
node --import tsx scripts/sync-host-manifests.ts --check
node --import tsx scripts/sync-host-wechat-shells.ts --check
node --import tsx scripts/check-host-routes.mjs
node --import tsx scripts/check-host-wiring.mjs
pnpm typecheck
pnpm test
```

`verify:release` runs `pnpm verify` first, then validates each official sample host in order:

```bash
pnpm verify:host host-h5
pnpm verify:host host-wechat
pnpm verify:host novel-h5
pnpm verify:host novel-wechat
```

`scaffold:page` now derives default host page data, route shape, and page wiring from the feature package when the feature exposes scaffold template metadata, including semantic controller placeholders such as `detailRouteId`, `loginRouteId`, and `settingsRouteId` when the feature manifest supports them.

## Editing Rules

- Shared code must not call `wx.*` or `window.*` directly.
- Platform-specific behavior belongs in `packages/platform-*` or host apps.
- Expected failures should flow through `Result<T>`, not thrown exceptions.
- Host route wiring should stay manifest- and registry-driven instead of handwritten in multiple places.
- Treat `apps/*/src/manifest/page-definitions.ts` as the host source of truth for page enablement and host overrides.
- Treat generated `app.manifest.ts`, `page-registry.ts`, and WeChat shell artifacts as derived files; regenerate them instead of editing them by hand.
- Keep feature-owned defaults in `packages/features/*`; use host manifests only for host-specific overrides.
- Prefer extending existing feature packages before adding new top-level abstractions.

## Key References

- [Architecture](docs/ARCHITECTURE.md)
- [Architecture Folder](docs/architecture/README.md)
- [Agent Guide](docs/AGENT_GUIDE.md)
- [Backend Contract](docs/BACKEND_CONTRACT.md)
- [Module Notes](docs/modules/README.md)
- [Roadmap](docs/ROADMAP.md)
- [Release Runbook](docs/RELEASE_RUNBOOK.md)
- [Repo Specs](specs/repo.yaml)
- [Verification Log](docs/VERIFICATION_LOG.md)
- [WeChat Host README](apps/host-wechat/README.md)
- [H5 Host README](apps/host-h5/README.md)
- [Novel WeChat README](apps/novel-wechat/README.md)
- [Novel H5 README](apps/novel-h5/README.md)
Official sample integration gate:

```bash
pnpm verify:official-integrations
```

This gate starts the local API, creates the four official sample runtimes against the real API adapters, and verifies login, protected reads, reader or shelf persistence, and membership unlock flows end to end.

Verify a remotely deployed API:

```bash
MINIX_API_BASE_URL="https://<worker-url>.workers.dev" pnpm verify:api:remote
```

Point the official H5 samples at a remote API by setting `MINIX_API_BASE_URL` before bootstrap. Point the WeChat samples at a remote API by setting `globalThis.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "https://<worker-url>.workers.dev" }` before runtime bootstrap, as documented in the host app READMEs.
