# MiniX Backend Contract

This document summarizes the current server-facing contract used by the `v1.0.0` release-cut repository. It is intentionally concise and should stay aligned with the real types under `packages/contracts` and the real API domains under `apps/api/src/domains`.

Use it together with:

- [`../README.md`](../README.md)
- [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)

## Scope

The current contract surface supports these official samples:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

It is split into two layers:

- shared host flows used across all official samples
- richer novel and commerce flows used by the novel samples

This document is a baseline, not a full endpoint dump. The source of truth for exact shapes remains the typed contracts and API route implementations.

## Canonical Domain Outputs

Shared controllers and hosts should consume the normalized nested outputs below instead of inventing host-local wrappers.

| Domain | Canonical outputs | Main contract owners | Current notes |
| --- | --- | --- | --- |
| auth | `session`, `identity`, `authStatus`, `redirectTarget` | `packages/contracts/src/api/auth.ts` | login and refresh keep compatibility top-level token fields, but the nested session and identity outputs are authoritative |
| user | `userProfile`, `accountSummary`, `userStatus` | `packages/contracts/src/api/user.ts` | account responses also carry identity workflow and security-center data |
| settings | `preferences`, `featureToggles`, `privacyOptions` | `packages/contracts/src/api/settings.ts` | `effectivePolicy`, `notificationChannels`, and `lockedSettingKeys` extend the same settings summary |
| messages | `notificationList`, `messageThread`, `unreadBadge` | `packages/contracts/src/api/message.ts` | messages are polling-only by design in the current sample |
| payment | `order`, `paymentIntent`, `paymentResult`, `entitlement` | `packages/contracts/src/api/payment.ts`, `packages/contracts/src/api/membership.ts` | generic hosts expose an order-center route; novel hosts keep order follow-up inside membership |
| content | `contentCard`, `contentDetail`, `contentAccess` | `packages/contracts/src/api/content.ts` | discover, detail, and novel flows reuse the same card/detail/access vocabulary |
| search | `searchQuery`, `searchFilters`, `searchResults` | `packages/contracts/src/api/feed.ts`, `packages/contracts/src/api/search.ts`, `packages/contracts/src/api/novels.ts` | discover now carries `activeDomain`, `domainTabs`, and grouped results |
| upload | `uploadTask`, `uploadAsset`, `uploadError` | `packages/contracts/src/api/upload.ts` | upload assets now use `coverImageUrl` consistently |
| share | `sharePayload`, `shareChannel`, `shareAttribution` | `packages/contracts/src/api/share.ts` | short-link and poster metadata stay inside the normalized share envelope |
| feedback | `feedbackTicket`, `feedbackCategory`, `feedbackStatus` | `packages/contracts/src/api/feedback.ts` | feedback now propagates shared context into support-thread linkage |

## Shared Context Envelope

Messages, share, upload, and feedback now share one context vocabulary.

- `sourceContext`: route or page provenance such as `pagePath`, `routeId`, optional `label`, and route params
- `actorContext`: actor or runtime provenance such as `userId`, `platform`, `appVersion`, and optional device summary

Current adoption:

- feedback submission stores and reuses `sourceContext` and `actorContext`
- upload reference binding carries the same two blocks
- share preparation returns source and attribution context using the same vocabulary
- message thread creation persists the same context shape

## Shared Page-State Baseline

The API and shared controllers assume these protocol boundaries:

- list-like surfaces use the shared list status model
- detail-like surfaces use the shared detail status model
- workflow and action surfaces use the shared form status model

Important explicit exceptions:

- auth login and identity handoff remain provider-aware workflows, not generic form pages
- reader remains an immersive runtime, not a generic detail page
- account and settings keep summary-style workspaces instead of forcing page-root list/detail shells

## Platform Capability Baseline

Feature code consumes normalized capability metadata before executing a platform action.

- `clipboard`, `device`, and `location` normalize availability instead of assuming the host runtime
- `share` may degrade to clipboard copy
- `upload` may use a configured runtime or a host fallback
- `payment` is unavailable unless the host runtime injects a real payment bridge

H5 and WeChat both expose capability status through the shared runtime surface, but the underlying implementation remains platform-specific.

## Domain Route Summary

The current API surface is grouped by domain under `apps/api/src/domains/*`.

### Auth

Representative routes:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verification-code/request`
- `POST /auth/password/register`
- `POST /auth/password/reset`
- `POST /auth/oauth/authorize`
- `POST /auth/oauth/callback`
- `POST /auth/identity/upgrade`
- `POST /auth/identity/bind-phone`
- `POST /auth/identity/bind-oauth`

Current posture:

- guest, WeChat code, phone verification, password, and OAuth are all modeled
- SMS and OAuth production modes fail closed unless real adapters are configured
- login and refresh both return the canonical auth envelope

### User And Settings

Representative routes:

- `GET /account/current`
- account profile, relation, and identity mutation routes under `apps/api/src/domains/account`
- `GET /settings`
- settings mutation routes under `apps/api/src/domains/settings`

Current posture:

- account summaries preserve session-derived data plus remote security and identity workflow data
- settings responses project `effectivePolicy`, notification channels, and lock posture into one normalized summary

### Messages

Representative routes:

- `GET /notifications`
- `POST /notifications/read`
- `GET /messages/threads`
- `GET /messages/thread`
- `POST /messages/thread/create`
- `POST /messages/thread/send`
- `POST /messages/thread/read`
- `POST /messages/thread/retry`
- `POST /messages/thread/sync`

Current posture:

- inbox browsing and thread detail are sample-backed in the repo
- sync mode is intentionally polling-only
- provider identity and rollout posture are exposed through normalized metadata, not hidden host logic

### Payment

Representative routes:

- purchase and order routes under `apps/api/src/domains/payment/routes.commerce.ts`
- callback routes under `apps/api/src/domains/payment/routes.callbacks.ts`
- after-sales and reconciliation routes under `apps/api/src/domains/payment/routes.after-sales.ts`

Current posture:

- order creation, purchase, callback verification, refund, and reconciliation are modeled
- production-mode callback verification expects operator-owned secrets and merchant setup

### Content And Search

Representative routes:

- discover and feed routes under `apps/api/src/domains/content/feed.ts`
- search routes under `apps/api/src/domains/content/search.ts`
- content detail and lifecycle routes under `apps/api/src/domains/content/routes.ts`

Current posture:

- discover is the canonical shared search surface
- default discover and cross-domain discover now share the same result vocabulary
- managed-content draft and lifecycle work stay embedded in the shared discover route on official hosts
- novel flows extend the same content vocabulary with reader-specific fields

### Upload, Share, And Feedback

Representative routes:

- upload session, chunk, complete, attach, retry, cancel under `apps/api/src/domains/uploads`
- share preparation, return recognition, and attribution reporting under `apps/api/src/domains/share`
- feedback bootstrap, submit, detail, revisit, and action routes under `apps/api/src/domains/feedback`

Current posture:

- upload, share, and feedback all participate in the shared context envelope
- upload and share expose explicit provider posture through normalized metadata
- feedback can link attachments and support-thread follow-up without inventing a second context model

## Runtime Notes

- The sample API uses opaque access and refresh tokens stored server-side.
- Worker deployments expect `DB` and `AUTH_RATE_LIMIT_KV`.
- Official sample media is served from the API under `/sample-assets/*`.
- Upload, share, and provider-backed message metadata can switch between sample and operator-owned production posture through Worker env configuration.

For operator setup and release expectations, use [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) and [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md).
