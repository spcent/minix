# MiniX Production Readiness

This document defines what the current repository supports as a `v1.0.0` sample release, what still depends on operator setup, and what remains intentionally outside tracked source.

Use it together with:

- [`../README.md`](../README.md)
- [`./BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md)
- [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md)
- [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md)

## Release Boundary

The release-cut surface is:

- `apps/api`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

Current repository guarantees:

- shared contracts, page protocols, and host wiring are frozen to the current official sample surface
- local verification and H5 automation are part of the repo
- WeChat manual validation is explicitly required
- provider-backed areas expose production-safe posture and fail closed when production mode lacks real adapters

Current repository does not include:

- real provider credentials
- real Cloudflare resource ids in tracked source
- real WeChat app ids in tracked source
- fully automated Mini Program production validation

## Operator-Owned Setup

### Required Worker Bindings

| Binding | Purpose |
| --- | --- |
| `DB` | durable API state, sessions, user state, commerce state, tickets, and jobs |
| `AUTH_RATE_LIMIT_KV` | durable auth throttling across Worker isolates |

### Required Runtime Variable Groups

| Area | Required variables |
| --- | --- |
| local and remote URLs | `MINIX_API_BASE_URL`, `MINIX_HOST_H5_BASE_URL`, `MINIX_NOVEL_H5_BASE_URL`, `MINIX_CORS_ALLOWED_ORIGINS` |
| auth | `MINIX_AUTH_SMS_PROVIDER_MODE`, `MINIX_AUTH_OAUTH_PROVIDER_MODE`, `MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS`, `MINIX_AUTH_LOGIN_MAX_ATTEMPTS`, `MINIX_AUTH_REFRESH_MAX_ATTEMPTS` |
| messages | `MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE` and optional provider labels or keys |
| upload | `MINIX_UPLOAD_PROVIDER_MODE`, `MINIX_UPLOAD_STORAGE_PROVIDER`, `MINIX_UPLOAD_REVIEW_PROVIDER`, `MINIX_UPLOAD_ASSET_BASE_URL` |
| share | `MINIX_SHARE_PROVIDER_MODE`, `MINIX_SHARE_SHORT_LINK_PROVIDER`, `MINIX_SHARE_POSTER_PROVIDER`, `MINIX_SHARE_SHORT_LINK_BASE_URL`, `MINIX_SHARE_POSTER_BASE_URL` |
| payment | `MINIX_PAYMENT_WEBHOOK_SECRET` |

## Current Release-Facing Gaps

The repo side is implemented for these areas, but final release still depends on operator rollout:

| Area | Repo posture | Remaining ownership |
| --- | --- | --- |
| auth | guest, WeChat code, phone, password, and OAuth flows are modeled; production mode fails closed without real adapters | SMS and OAuth provider rollout, callback registration, and environment validation |
| messages | inbox and thread flows are implemented; sync is explicitly polling-only | external provider rollout and explicit release acceptance of polling-only posture |
| payment | order, callback verification, refund, and reconciliation flows are implemented | merchant credentials, callback routing, and production verification |
| upload | upload pipeline and normalized provider posture are implemented | object storage, review backend, asset-host rollout |
| share | short-link, poster, and attribution flows are implemented | short-link and poster provider rollout |
| WeChat | shared feature surface is implemented across both Mini Program samples | manual DevTools or device validation and production allowlists |

## Required Evidence

Before release promotion, record evidence for:

- `pnpm verify`
- `pnpm verify:official-integrations`
- `pnpm verify:h5:blackbox`
- `pnpm verify:release`
- `pnpm verify:api:remote` when remote API deploys are involved
- `pnpm verify:preview:remote` when preview H5 deploys are involved
- manual WeChat validation for `host-wechat` and `novel-wechat`
- auth, message, payment, upload, and share rollout state
- final go or no-go signoff owner

All evidence should end up in [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md).

The repo now also exposes provider-readiness diagnostics through the authenticated `/ops/diagnostics` API surface. Use it to confirm whether auth, messages, payment callbacks, upload, and share are currently in `sample`, `ready`, `review`, or `blocked` posture for the target environment.

## Provider-Readiness Interpretation

Treat `/ops/diagnostics` as the repo-visible posture summary for `0241` to `0245`:

| Status | Meaning | Release posture |
| --- | --- | --- |
| `sample` | target still runs the sample provider path intentionally | acceptable only when the release record explicitly defers that production rollout |
| `ready` | repo-visible production inputs are configured and the target no longer depends on sample fallback | acceptable for release when manual validation and ownership evidence are also recorded |
| `review` | production mode is enabled, but env-backed rollout is still incomplete or still needs explicit acceptance | do not treat as release-ready until the missing fields or acceptance notes are recorded |
| `blocked` | production mode is enabled but the required adapter or provider path is not actually wired | release blocker until resolved or reverted from production mode |

Use that summary together with manual validation and deployment ownership. `/ops/diagnostics` is a release checkpoint, not a substitute for operator proof.

## Bundle Evidence Minimum

Record these bundle-level facts before closing `0241` to `0247`:

- auth:
  target env, SMS provider name, OAuth provider name, callback domain, `/ops/diagnostics` auth summary, and manual login or bind proof
- messages:
  target env, external channel owners, polling-only decision, `/ops/diagnostics` message summary, and inbox or notification proof
- payment:
  target env, merchant owner, callback URL or secret confirmation, `/ops/diagnostics` payment summary, and purchase or refund proof
- upload:
  target env, storage provider, review provider, asset host URL, `/ops/diagnostics` upload summary, and upload or attach proof
- share:
  target env, short-link provider, poster provider, deployed base URLs, `/ops/diagnostics` share summary, and short-link or attribution proof
- release:
  preview and production URLs, WeChat validator and date, final signoff owner, and go or no-go decision

## Active Queue Closure Rule

Treat the release queue as one bundle:

- `0241` to `0245` close provider-specific rollout posture
- `0246` closes final release execution and signoff
- `0247` keeps ordering, owners, blockers, and closeout criteria explicit

Do not mark the release bundle complete until:

- each provider-backed area records either production-ready rollout or an explicit deferral decision
- manual WeChat validation is recorded for the target environment
- `RELEASE_RUNBOOK` and `VERIFICATION_LOG` reflect the same final state

## Go / No-Go Rule

Ship only when all of the following are true:

- repo gates pass on the intended release commit
- required remote verification passes for the environments being promoted
- WeChat manual validation passes for the affected flows
- provider rollout state is explicit for auth, messages, payment, upload, and share
- the final release record names a signoff owner and decision

Do not ship when any of the following are true:

- production mode still depends on undeclared sample-only provider behavior
- required callback, allowlist, or remote-origin setup is missing
- manual WeChat validation has not been completed for the affected environment
- a release-critical issue is only mentioned informally and not captured in tracked evidence

## Accepted Deferred Issues

These remain acceptable only when they are recorded explicitly in the release evidence:

- real SMS provider credentials and retry policy remain operator-owned
- real OAuth provider credentials, callback registration, and token validation remain operator-owned
- real merchant credentials and dashboard-side payment setup remain operator-owned
- external object storage, review backends, short-link providers, and poster providers remain operator-owned
- Mini Program release proof still requires manual validation outside repo automation
