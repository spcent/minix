# MiniX Production Readiness

This document defines what the repository supports as a `v1.0.0` release-cut sample system, what operators must configure outside the repo, and which gaps are intentionally deferred.

Use it together with:

- [`docs/RELEASE_RUNBOOK.md`](/Users/bingrong.yan/projects/birdor/minix/docs/RELEASE_RUNBOOK.md) for the operator sequence
- [`docs/PRODUCTION_REGRESSION_MATRIX.md`](/Users/bingrong.yan/projects/birdor/minix/docs/PRODUCTION_REGRESSION_MATRIX.md) for automation and manual coverage
- [`docs/BACKEND_CONTRACT.md`](/Users/bingrong.yan/projects/birdor/minix/docs/BACKEND_CONTRACT.md) for the request and response surface

## Release Boundary

`v1.0.0` is release-ready as an official sample surface for:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`
- `apps/api`

That means:

- shared business contracts, runtime behavior, and release gates are frozen and verified
- preview and production deployment steps are documented
- H5 regression coverage and WeChat manual gates are explicit
- secrets, third-party credentials, and cloud resource ids are intentionally not committed

It does not mean this repository ships a fully credentialed commercial product deployment out of the box.

## Provider And Environment Setup

The repo ships safe templates and sample-compatible defaults only. Real ids, secrets, and operator-specific callback domains must stay outside tracked source.

### Required Runtime Variables

| Key | Scope | Purpose |
| --- | --- | --- |
| `MINIX_API_PORT` | local node api | overrides local API port; defaults to `3000` |
| `MINIX_API_BASE_URL` | H5 bootstrap, deploy, remote verification | points H5 hosts at a remote Worker or preview target |
| `MINIX_HOST_H5_BASE_URL` | remote H5 verification | target URL for preview or production host-h5 smoke |
| `MINIX_NOVEL_H5_BASE_URL` | remote H5 verification | target URL for preview or production novel-h5 smoke |
| `MINIX_CORS_ALLOWED_ORIGINS` | Worker env | comma-separated extra browser origins beyond localhost defaults |
| `MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS` | Worker env | auth rate-limit window |
| `MINIX_AUTH_LOGIN_MAX_ATTEMPTS` | Worker env | login attempts per client and platform |
| `MINIX_AUTH_REFRESH_MAX_ATTEMPTS` | Worker env | refresh attempts per client and platform |
| `MINIX_PAYMENT_WEBHOOK_SECRET` | Worker env | HMAC secret for production-mode payment callback verification |

### Required Worker Bindings

| Binding | Purpose |
| --- | --- |
| `DB` | durable D1-backed sessions, user state, ledgers, content state, ticket state, and jobs |
| `AUTH_RATE_LIMIT_KV` | durable auth rate-limit counters across Worker isolates in preview and production |

### Provider Setup Notes

- Keep real Cloudflare ids in the ignored [`apps/api/wrangler.private.jsonc`](/Users/bingrong.yan/projects/birdor/minix/apps/api/wrangler.private.jsonc), not the committed template.
- Payment production-mode callback verification is implemented, but operators must provide the real `MINIX_PAYMENT_WEBHOOK_SECRET` and gateway routing outside the repo.
- OAuth state, callback validation, provider binding, revoke, and merge guidance are implemented, but real provider client ids, client secrets, and callback registration live outside the repo.
- Phone verification, password reset, and account-security challenges are modeled end to end; local sample mode exposes debug codes and does not ship a real SMS provider credential.

## Callback, Domain, And Allowlist Checklist

Before preview or production validation:

- register the API HTTPS domain in WeChat console allowlists for:
  - request
  - uploadFile
  - downloadFile
- register H5 preview and production origins in `MINIX_CORS_ALLOWED_ORIGINS` when they differ from the committed defaults
- register real OAuth callback URLs against the deployed API domain for each chosen provider
- route payment provider callbacks to `POST /payments/callback` on the deployed API domain

## Storage And Background Jobs

### Storage Model

| Concern | Current release posture |
| --- | --- |
| sessions and business state | D1-backed in Worker deployments |
| auth rate limiting | KV-backed in preview and production when `AUTH_RATE_LIMIT_KV` is bound |
| sample media | served by the API under `/sample-assets/*` |
| upload lifecycle | backend-modeled through session/chunk/complete/attach endpoints; no external object bucket binding is committed in the repo |
| share attribution | backend-persisted in API state |

### Background Job Surface

The release sample schedules and monitors these durable job kinds:

- `upload_cleanup`
- `payment_reconciliation`
- `notification_retry`
- `cancellation_expiry`

Operational diagnostics, manual execution, and idempotent replay are part of the API surface and covered by test.

## Host Capability Support Matrix

| Capability | host-h5 | novel-h5 | host-wechat | novel-wechat |
| --- | --- | --- | --- | --- |
| `clipboard` | native when browser API exists | native when browser API exists | native through WeChat bridge | native through WeChat bridge |
| `device` | native through browser environment | native through browser environment | native through WeChat bridge | native through WeChat bridge |
| `location` | native when browser geolocation exists | native when browser geolocation exists | native through WeChat bridge | native through WeChat bridge |
| `share` | native `navigator.share`, degrades to clipboard copy | native `navigator.share`, degrades to clipboard copy | native share menu, degrades to clipboard copy | native share menu, degrades to clipboard copy |
| `upload` | configured upload runtime or browser file picker fallback | configured upload runtime or browser file picker fallback | native WeChat upload/media bridge | native WeChat upload/media bridge |
| `payment` | requires injected H5 payment runtime; otherwise unavailable | requires injected H5 payment runtime; otherwise unavailable | native WeChat payment bridge when configured | native WeChat payment bridge when configured |

Release expectation:

- H5 hosts must not crash when a capability is unavailable; they must surface normalized degraded or unavailable state.
- WeChat hosts must be manually validated for native upload, share, and payment behavior on the intended target environment.

## Release Go Or No-Go

Ship only when all of the following are true:

- `pnpm verify` passes on the release candidate commit
- `pnpm verify:official-integrations` passes against the local API
- `pnpm verify:h5:blackbox` passes with the full Playwright matrix
- `pnpm verify:release` passes
- remote preview verification passes for API and H5 when the release touches deployed infrastructure
- WeChat manual gates pass for the affected flows
- the release record captures commit SHA, verified URLs, and accepted deferred issues

Do not ship when any of the following are true:

- the repo is still relying on mock-only behavior in a release validation path
- callback verification or auth throttling bindings are missing for the intended deployment mode
- WeChat allowlists, app ids, or callback domains are still placeholder values
- a deferred issue silently blocks a documented release-critical flow

## Accepted Deferred Issues

The following are explicit non-goals or operator-owned gaps for the release-cut sample:

- real SMS delivery credentials are not committed; local and sample paths use simulated verification delivery
- real OAuth provider credentials and production callback registration are operator-owned and not stored in tracked source
- no external object storage bucket or CDN binding is committed; upload lifecycle is modeled and verified through the sample backend surface
- payment gateway verification is implemented, but the repo does not ship live merchant credentials or gateway dashboards
- WeChat release proof still requires manual DevTools or device validation; there is no fully automated Mini Program production runner in the repo

These are acceptable only if the release record states them explicitly and the intended deployment owner confirms the external setup is complete.
