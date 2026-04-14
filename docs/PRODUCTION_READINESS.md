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
| `MINIX_AUTH_SMS_PROVIDER_MODE` | Worker env | set to `production` only when a real SMS delivery adapter is wired; otherwise sample delivery stays active |
| `MINIX_AUTH_OAUTH_PROVIDER_MODE` | Worker env | set to `production` only when a real OAuth provider adapter is wired; otherwise sample authorize posture stays active |
| `MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS` | Worker env | auth rate-limit window |
| `MINIX_AUTH_LOGIN_MAX_ATTEMPTS` | Worker env | login attempts per client and platform |
| `MINIX_AUTH_REFRESH_MAX_ATTEMPTS` | Worker env | refresh attempts per client and platform |
| `MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE` | Worker env | set to `production` only when external message touchpoints should present operator-owned provider posture instead of sample posture |
| `MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY` / `MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL` | Worker env | optional override for subscription-message provider identity shown in settings and inbox surfaces |
| `MINIX_MESSAGE_SMS_PROVIDER_KEY` / `MINIX_MESSAGE_SMS_PROVIDER_LABEL` | Worker env | optional override for SMS provider identity shown in settings and inbox surfaces |
| `MINIX_MESSAGE_EMAIL_PROVIDER_KEY` / `MINIX_MESSAGE_EMAIL_PROVIDER_LABEL` | Worker env | optional override for email provider identity shown in settings and inbox surfaces |
| `MINIX_MESSAGE_PUSH_PROVIDER_KEY` / `MINIX_MESSAGE_PUSH_PROVIDER_LABEL` | Worker env | optional override for push provider identity shown in settings and inbox surfaces |
| `MINIX_UPLOAD_PROVIDER_MODE` | Worker env | set to `production` only when upload review/storage surfaces should present operator-owned production posture instead of sample posture |
| `MINIX_UPLOAD_STORAGE_PROVIDER` | Worker env | optional label for the configured upload object-storage backend |
| `MINIX_UPLOAD_REVIEW_PROVIDER` | Worker env | optional label for the configured upload review backend |
| `MINIX_UPLOAD_ASSET_BASE_URL` | Worker env | optional absolute base URL used when upload responses should emit asset URLs from a dedicated asset host |
| `MINIX_SHARE_PROVIDER_MODE` | Worker env | set to `production` only when share surfaces should present operator-owned short-link and poster posture instead of sample posture |
| `MINIX_SHARE_SHORT_LINK_PROVIDER` | Worker env | optional label for the configured short-link provider shown in share metadata and media-tools surfaces |
| `MINIX_SHARE_POSTER_PROVIDER` | Worker env | optional label for the configured poster-generation provider shown in share metadata and media-tools surfaces |
| `MINIX_SHARE_SHORT_LINK_BASE_URL` | Worker env | optional absolute base URL used when share responses should emit operator-owned short links |
| `MINIX_SHARE_POSTER_BASE_URL` | Worker env | optional absolute base URL used when share responses should emit poster asset URLs from a dedicated host |
| `MINIX_PAYMENT_WEBHOOK_SECRET` | Worker env | HMAC secret for production-mode payment callback verification |

### Required Worker Bindings

| Binding | Purpose |
| --- | --- |
| `DB` | durable D1-backed sessions, user state, ledgers, content state, ticket state, and jobs |
| `AUTH_RATE_LIMIT_KV` | durable auth rate-limit counters across Worker isolates in preview and production |

## Launch Blocker Ownership

The repository now exposes production-safe posture for auth, payment, messages, uploads, and share flows, but release still depends on operator-owned configuration and explicit evidence capture.

| Area | Required setup or validation | Ownership | Evidence |
| --- | --- | --- | --- |
| Worker env vars | configure `MINIX_CORS_ALLOWED_ORIGINS`, auth provider modes, message provider labels, upload provider labels, share provider labels, and `MINIX_PAYMENT_WEBHOOK_SECRET` for the target environment | operator-owned | environment inventory or deployment config review |
| Durable bindings | bind `DB` and `AUTH_RATE_LIMIT_KV` in both preview and production Worker environments | operator-owned | `wrangler` config review plus successful remote deploy |
| WeChat allowlists | register final API HTTPS domain under request, `uploadFile`, and `downloadFile` allowlists | operator-owned | WeChat console screenshots or release ticket evidence |
| H5 remote origins | point H5 hosts at the intended API base URL and include preview or production origins in CORS allowlists | operator-owned | deployed URL list plus successful remote blackbox run |
| Remote API validation | run `pnpm verify:api:remote` against preview and production Workers after deploy | shared: operator executes, repo provides command | command log recorded in [`docs/VERIFICATION_LOG.md`](/Users/bingrong.yan/projects/birdor/minix/docs/VERIFICATION_LOG.md) |
| H5 regression validation | run `pnpm verify:h5:blackbox` locally and `pnpm verify:preview:remote` against preview Pages URLs | shared: operator executes, repo provides command | command log recorded in verification log |
| WeChat manual validation | complete the host-wechat and novel-wechat manual gate against preview and production | operator-owned | validator name, date, app target, and pass or fail notes in verification log |
| Release signoff | record RC/final evidence and signoff owner before tagging or promoting | release manager | completed release checklist and signoff note |

### Provider Setup Notes

- Keep real Cloudflare ids in the ignored [`apps/api/wrangler.private.jsonc`](/Users/bingrong.yan/projects/birdor/minix/apps/api/wrangler.private.jsonc), not the committed template.
- Payment production-mode callback verification is implemented, but operators must provide the real `MINIX_PAYMENT_WEBHOOK_SECRET` and gateway routing outside the repo.
- Official host commerce entry is now exposed at [`apps/host-h5:/membership`](/Users/bingrong.yan/projects/birdor/minix/apps/host-h5/src/manifest/page-definitions.ts) and [`apps/host-wechat:/pages/membership/index`](/Users/bingrong.yan/projects/birdor/minix/apps/host-wechat/src/manifest/page-definitions.ts), with a dedicated generic order-center route at [`apps/host-h5:/orders`](/Users/bingrong.yan/projects/birdor/minix/apps/host-h5/src/manifest/page-definitions.ts) and [`apps/host-wechat:/pages/orders/index`](/Users/bingrong.yan/projects/birdor/minix/apps/host-wechat/src/manifest/page-definitions.ts). Novel hosts intentionally keep order follow-up inside the membership-centered reading flow. If operators do not switch to real gateway credentials, transaction copy remains sample-mode by design; when `providerMode=production` is used, the shared commerce surface now keeps purchase, callback, refund, and reconciliation copy free of sample-only wording.
- Inbox entry is now exposed across all four sample hosts at [`apps/host-h5:/inbox`](/Users/bingrong.yan/projects/birdor/minix/apps/host-h5/src/manifest/page-definitions.ts), [`apps/host-wechat:/pages/messages/index`](/Users/bingrong.yan/projects/birdor/minix/apps/host-wechat/src/manifest/page-definitions.ts), [`apps/novel-h5:/inbox`](/Users/bingrong.yan/projects/birdor/minix/apps/novel-h5/src/manifest/page-definitions.ts), and [`apps/novel-wechat:/pages/messages/index`](/Users/bingrong.yan/projects/birdor/minix/apps/novel-wechat/src/manifest/page-definitions.ts). The current delivery contract is explicitly polling-only; external `subscription_message`, `sms`, `email`, and `push` touchpoints can present production provider posture through env-backed labels and keys, but the actual provider rollout remains operator-owned outside tracked source.
- Upload surfaces now expose explicit sample-versus-production posture through env-backed review/storage metadata. Operators can switch the official sample from `sample-upload-policy` and `sample-object-storage` to production-safe labels and asset URL hosts through `MINIX_UPLOAD_PROVIDER_MODE`, `MINIX_UPLOAD_STORAGE_PROVIDER`, `MINIX_UPLOAD_REVIEW_PROVIDER`, and `MINIX_UPLOAD_ASSET_BASE_URL`, but the actual bucket, retention, and review-provider rollout remains operator-owned outside tracked source.
- Share surfaces now expose explicit sample-versus-production posture through env-backed short-link and poster metadata. Operators can switch the official sample from `sample-short-link` and `sample-poster-provider` to production-safe labels and URL hosts through `MINIX_SHARE_PROVIDER_MODE`, `MINIX_SHARE_SHORT_LINK_PROVIDER`, `MINIX_SHARE_POSTER_PROVIDER`, `MINIX_SHARE_SHORT_LINK_BASE_URL`, and `MINIX_SHARE_POSTER_BASE_URL`, but the actual short-link and poster-provider rollout remains operator-owned outside tracked source.
- Managed-content drafting and review are intentionally surfaced inside the shared discover/feed route on the official hosts. Operators should treat that route as the bounded editorial entry rather than expecting a separate host-local CMS console in the release-cut sample.
- OAuth state, callback validation, provider binding, revoke, and merge guidance are implemented, but real provider client ids, client secrets, provider adapters, and callback registration live outside the repo. Setting `MINIX_AUTH_OAUTH_PROVIDER_MODE=production` without wiring an OAuth provider now fails closed with `503 PROVIDER_UNAVAILABLE` instead of returning a sample authorization URL.
- Phone verification, password reset, and account-security challenges are modeled end to end. Local and sample mode expose debug codes through the built-in simulated delivery path, while production mode must inject a real SMS delivery adapter into the API runtime. Setting `MINIX_AUTH_SMS_PROVIDER_MODE=production` without wiring that adapter now fails closed with `503 PROVIDER_UNAVAILABLE` instead of silently reusing sample delivery.
- Official login surfaces now show SMS recovery and OAuth callback posture directly. Operators should not expect a separate auth-recovery host route in the release-cut sample.

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

Official auth entry posture:

- official H5 hosts treat Home sign-in as the built-in guest path unless a host injects another credential provider deliberately
- official WeChat hosts treat Home sign-in as the `wx.login` to `wechat_code` exchange path
- phone verification and OAuth must keep their sample versus production backing explicit in user-visible copy and release notes

## Accepted Deferred Issues

The following are explicit non-goals or operator-owned gaps for the release-cut sample:

- real SMS delivery credentials are not committed; local and sample paths use simulated verification delivery
- the API now requires an injected SMS delivery adapter before production mode can issue `login`, `password_reset`, or `account_security` verification challenges; operators own the concrete provider binding and retry policy
- the API now requires an injected OAuth provider adapter before production mode can issue provider-backed authorize or callback validation; operators own callback-domain registration, secrets, and provider-token verification policy
- real OAuth provider credentials and production callback registration are operator-owned and not stored in tracked source
- no external object storage bucket or CDN binding is committed; upload lifecycle is modeled and verified through the sample backend surface
- payment gateway verification is implemented, but the repo does not ship live merchant credentials or gateway dashboards
- WeChat release proof still requires manual DevTools or device validation; there is no fully automated Mini Program production runner in the repo

These are acceptable only if the release record states them explicitly and the intended deployment owner confirms the external setup is complete.
