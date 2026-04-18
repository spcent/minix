# Domain Completeness Matrix

This matrix summarizes the current repository posture by business domain. It focuses on real ownership, host exposure, and the remaining release-facing gaps.

Use it together with:

- [`../README.md`](../README.md)
- [`./BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md)

Status labels:

- `implemented`: contracts, API, shared behavior, and official-host exposure are in place
- `partial`: repo behavior is in place, but release still depends on operator rollout or explicit release acceptance

## Domain Status

| Domain | Status | Main owners | Official host entry points | Current note | Follow-up |
| --- | --- | --- | --- | --- | --- |
| login | `partial` | `packages/contracts/src/api/auth.ts`, `packages/features/auth`, `apps/api/src/domains/auth` | `host-h5:/`, `host-wechat:/pages/login/index`, `novel-h5:/login`, `novel-wechat:/pages/login/index` | guest, WeChat code, phone, password, and OAuth are modeled; production provider rollout remains operator-owned | [`../tasks/cards/active/0241-auth-provider-operator-rollout.md`](../tasks/cards/active/0241-auth-provider-operator-rollout.md) |
| user | `implemented` | `packages/contracts/src/api/user.ts`, `packages/features/account`, `apps/api/src/domains/account` | all four hosts expose account entry points | account summary now carries profile, identity, security, assets, and workflow posture in one shared surface | `—` |
| settings | `implemented` | `packages/contracts/src/api/settings.ts`, `packages/features/settings`, `apps/api/src/domains/settings` | all four hosts expose settings | settings summary now projects preferences, feature toggles, privacy, effective policy, channels, and lock posture | `—` |
| messages | `partial` | `packages/contracts/src/api/message.ts`, `packages/features/messages`, `apps/api/src/domains/messages` | all four hosts expose inbox entry points | host exposure is closed; sync remains intentionally polling-only and provider rollout is operator-owned | [`../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md) |
| payment | `partial` | `packages/contracts/src/api/payment.ts`, `packages/features/subscription`, `apps/api/src/domains/payment` | generic hosts expose membership and orders; novel hosts expose membership | callback verification and commerce flows are modeled; merchant rollout remains operator-owned | [`../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`](../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md) |
| content | `implemented` | `packages/contracts/src/api/content.ts`, `packages/features/feed`, `catalog`, `novel-detail`, `apps/api/src/domains/content` | discover on all hosts; novel detail and reader on novel hosts | managed-content draft and lifecycle stay intentionally embedded in discover/feed | `—` |
| search | `implemented` | `packages/contracts/src/api/search.ts`, `packages/features/feed`, `apps/api/src/domains/content/feed.ts`, `search.ts` | discover on all hosts | discover now keeps shared `activeDomain`, `domainTabs`, and grouped results | `—` |
| list | `implemented` | `packages/core/src/page-protocols/list.ts` plus feature adopters | items, discover, inbox, and order-centered surfaces | no blocked host route remains | `—` |
| detail | `implemented` | `packages/core/src/page-protocols/detail.ts` plus feature adopters | novel detail, reader, embedded message/order detail | reader and embedded detail remain explicit protocol exceptions | `—` |
| form | `implemented` | `packages/core/src/page-protocols/form.ts` plus feature adopters | account, feedback, discover authoring | account and feedback use shared form posture; auth stays provider-aware by design | `—` |
| upload | `partial` | `packages/contracts/src/api/upload.ts`, `packages/features/media-tools`, `apps/api/src/domains/uploads` | all four hosts expose media-tools entry points | upload flow is modeled end to end; storage and review rollout remain operator-owned | [`../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`](../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md) |
| share | `partial` | `packages/contracts/src/api/share.ts`, `packages/features/media-tools`, `apps/api/src/domains/share` | all four hosts expose media-tools entry points | short-link and poster posture are normalized; provider rollout remains operator-owned | [`../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`](../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md) |
| feedback | `implemented` | `packages/contracts/src/api/feedback.ts`, `packages/features/feedback`, `apps/api/src/domains/feedback` | all four hosts expose feedback entry points | feedback now shares context vocabulary with messages, upload, and share | `—` |

## Current Implementation Notes

These repo-level follow-ups are already reflected in current code:

- `0249`: user and settings summaries are aligned across contracts, API, and shared controllers
- `0250`: discover and content-search outputs are aligned across API and shared feed controller state
- `0251`: no new page-protocol gap is open after the recent account, settings, and discover updates
- `0252`: messages, share, upload, and feedback now share one nested context envelope
- `0256`: future content and discover growth is now explicitly constrained to additive extensions of the current shared content, search, upload, and feedback stack
- `0257`: future account and relationship growth is now explicitly constrained to the shared account workspace and canonical account outputs
- `0258`: capability posture is now surfaced through shared feature-state summaries instead of relying on host-local fallback copy

Those cards still exist as traceable work items, but their repo-facing implementation posture is already reflected in current code and docs.

## Current Post-Release Expansion Posture

- content and discover:
  editorial, moderation, ranking, and richer asset metadata should extend the current discover-centered content stack additively; a second content stack or host-only editorial lane remains out of bounds
- account and relationship:
  relation graphs, entitlement history, merge, and security follow-up should extend the shared account workspace first; a separate user-detail surface still requires an explicit boundary decision
- capability experience:
  degraded and unavailable payment, share, and upload posture should stay normalized in shared controller state, while adapter-specific behavior remains isolated in `packages/platform-*`

## Active Release Queue

The remaining release-facing queue is mostly operator-owned:

| Priority | Card | Current purpose | Evidence anchor |
| --- | --- | --- | --- |
| `P0` | [`../tasks/cards/active/0247-release-follow-up-queue-coordination.md`](../tasks/cards/active/0247-release-follow-up-queue-coordination.md) | keep rollout order, blockers, and closeout criteria explicit | [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md), [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md) |
| `P0` | [`../tasks/cards/active/0241-auth-provider-operator-rollout.md`](../tasks/cards/active/0241-auth-provider-operator-rollout.md) | close auth provider rollout and callback readiness | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md) | close external message-provider rollout and explicit polling acceptance | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`](../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md) | close merchant, callback, and reconciliation rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`](../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md) | close upload provider and asset-host rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`](../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md) | close short-link and poster rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0246-release-execution-and-signoff.md`](../tasks/cards/active/0246-release-execution-and-signoff.md) | capture final release decision and signoff | [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md) |

## Execution Order

Use this order unless a release owner explicitly decides otherwise:

1. `0247` establishes owners, environments, and evidence locations.
2. `0241` to `0245` close provider-specific rollout and acceptance in parallel where possible.
3. `0246` closes only after the provider tracks and manual validation evidence are recorded.

## Ownership Split

- Product: confirm degraded-mode acceptance and any explicit release exceptions
- Backend: own provider configuration, callback posture, and API-side rollout
- Frontend: validate host-visible behavior against normalized shared outputs
- Release: keep `PRODUCTION_READINESS`, `RELEASE_RUNBOOK`, and `VERIFICATION_LOG` synchronized
