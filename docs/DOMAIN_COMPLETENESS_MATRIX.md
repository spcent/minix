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

## Requested Capability Audit

This section expands the matrix against the product capability list requested on 2026-04-25. The audit uses repository evidence instead of intent-only task names:

- contracts: `packages/contracts/src/api/*`, `packages/contracts/src/kernel/common-page.ts`
- shared controllers and state: `packages/features/*`, `packages/core/src/page-protocols/*`
- API implementation: `apps/api/src/domains/*`
- official host exposure: `apps/*/src/manifest/page-definitions.ts`

| Domain | Requested coverage now present | Current implementation evidence | Remaining boundary |
| --- | --- | --- | --- |
| login | WeChat code, phone verification, password, guest, and reserved OAuth login methods; session login, refresh, logout, restore, expiry, and forced reauth; guest upgrade, phone binding, OAuth binding, account merge; redirect target and source handoff; device identity, risk decision, rate limit, audit, and abnormal login prompt; shared `session`, `identity`, `authStatus`, `redirectTarget` output | `packages/contracts/src/api/auth.ts`, `packages/features/auth`, `apps/api/src/domains/auth`, identity upgrade/bind/merge routes in generic hosts | `partial`: production SMS/OAuth providers, callback registration, and operator evidence remain outside tracked source |
| user | profile fields, account summary, status flags, asset ledger and entitlements, relation counts and relation actions; shared `userProfile`, `accountSummary`, `userStatus` output | `packages/contracts/src/api/user.ts`, `packages/features/account`, `apps/api/src/domains/account`, `/me`, profile, phone change, provider unlink/revoke, cancellation, relation list/action, asset history routes | no repo-side blocker; future user-detail surfaces should extend the account workspace first |
| settings | language, theme, font scale, notification/privacy toggles, device policy, account-setting entry labels, content preferences, developer flags; shared `preferences`, `featureToggles`, `privacyOptions` output plus effective policy | `packages/contracts/src/api/settings.ts`, `packages/features/settings`, `apps/api/src/domains/settings`, all official settings pages | no repo-side blocker; production policy changes should remain additive to `SettingsResponse` |
| messages | system/business/campaign/review notifications; private, consultation, customer-service, and reserved group threads; unread, read receipt, pin, DND, thread read/send/retry/sync; in-app, subscription message, SMS, email, push touchpoint abstraction; pagination, grouping, filters, mark-read; shared `notificationList`, `messageThread`, `unreadBadge` output | `packages/contracts/src/api/message.ts`, `packages/features/messages`, `apps/api/src/domains/messages`, inbox pages on all hosts | `partial`: real external touchpoint provider rollout and polling-only release acceptance remain operator-owned |
| payment | order create/list/detail, pending/paid/closed/refund/cancel states, membership and virtual entitlement purchases, product/SKU/catalog models, result query, callback verification, reconciliation, idempotency and duplicate protection, polling continuity; shared `order`, `paymentIntent`, `paymentResult`, `entitlement` output | `packages/contracts/src/api/payment.ts`, `packages/features/subscription`, `apps/api/src/domains/payment`, membership/orders host pages | `partial`: live merchant credentials, payment dashboard setup, and deployed callback evidence remain operator-owned |
| content | article/course/consultation/tool/post/event/novel models; draft/published/offline/review/deleted states; category/tags/topics/recommendation/pinned/featured display; public/login/member/purchased access; publish/update/archive/delete/restore/review lifecycle; shared `contentCard`, `contentDetail`, `contentAccess` output | `packages/contracts/src/api/content.ts`, `packages/features/feed`, `catalog`, `novel-detail`, `reader`, `apps/api/src/domains/content` | no repo-side blocker; new content families are out of scope unless explicitly requested |
| search | global/content/user/domain modes, keyword query, suggestions, hot and recent keywords, title/body/tag/author/category/location-style matching metadata, pagination, filters, sort, zero-result and correction guidance, route writeback/persistence; shared `searchQuery`, `searchFilters`, `searchResults` output | `packages/contracts/src/api/search.ts`, `packages/features/feed`, `apps/api/src/domains/content/search.ts`, `/feed` route | no repo-side blocker; search remains discover/feed-centered |
| list | feed/table/card/grid/group-list-compatible state model, first load, refresh, append pagination, retry, loading/empty/error/partial/skeleton states, selection and batch selection, sort/filter state, sticky-header flag, render metadata, saved filters, and batch action descriptors; shared `items`, `pagination`, `filters`, `selectedItemId` output | `packages/contracts/src/kernel/common-page.ts`, `packages/core/src/page-protocols/list.ts`, adopters in items, feed, messages, payment/account lists | no repo-side blocker; table/grid rendering remains host UI responsibility |
| detail | content, order, user/account, message/consultation, and tool-result detail carriers; loading, refresh, invalidated, deleted, forbidden, offline, unavailable states; action slots; list/share/deep-link entry context; related/comment/attachment/action-bar extension points through domain detail payloads; shared `detailData`, `detailStatus`, `detailActions` output | `packages/contracts/src/kernel/common-page.ts`, `packages/core/src/page-protocols/detail.ts`, content/order/message/account controllers | no repo-side blocker; reader and embedded detail surfaces remain documented protocol exceptions |
| form | registration/login completion-compatible form protocol, consultation/feedback/content publishing patterns, text/number/date/select/upload/rich-text placeholder fields, required/length/format/cross-field/async validation, draft save, submit, duplicate protection, result state, steps, approval nodes, dynamic and conditional fields; shared `formValues`, `validationErrors`, `submitState` output | `packages/contracts/src/kernel/common-page.ts`, `packages/core/src/page-protocols/form.ts`, `packages/features/feedback`, account operations, content draft workflow | no repo-side blocker; auth remains provider-aware rather than a generic-only form |
| upload | image/audio/video/PDF/avatar/attachment types; choose, compress, reserved chunking, upload, review, progress, retry, cancel; governance for size/type/review/retention; URLs, thumbnail, cover, metadata and derived variants; H5/WeChat capability adapters; shared `uploadTask`, `uploadAsset`, `uploadError` output | `packages/contracts/src/api/upload.ts`, `packages/features/media-tools`, `packages/platform-h5`, `packages/platform-wechat`, `apps/api/src/domains/uploads` | `partial`: external object storage, review provider, and asset-host rollout remain operator-owned |
| share | page/content/invite/poster scenarios, WeChat session/moments, copy link, poster image, short link channels, title/summary/cover/landing/tracking/channel markers, invite binding, return recognition, attribution counters; shared `sharePayload`, `shareChannel`, `shareAttribution` output | `packages/contracts/src/api/share.ts`, `packages/features/media-tools`, `apps/api/src/domains/share`, public poster route | `partial`: short-link and poster providers plus deployed attribution evidence remain operator-owned |
| feedback | issue/suggestion/complaint/abuse/satisfaction types, FAQ and support entries, ticket state/progress/revisit loop, source/user/device/version/screenshot/attachment context capture, categories, labels, priority, callback/revisit and processing history; shared `feedbackTicket`, `feedbackCategory`, `feedbackStatus` output | `packages/contracts/src/api/feedback.ts`, `packages/features/feedback`, `apps/api/src/domains/feedback`, feedback host pages | no repo-side blocker; support-message delivery still follows messages provider rollout posture |

## Expansion Matrix

The next additive expansion should keep each domain inside its existing owner and output envelope:

| Domain | Additive expansion slots | Do not add |
| --- | --- | --- |
| login | richer risk rules, more provider descriptors, stronger credential recovery summaries, additional audit event scopes | a second auth controller, host-local token stores, or deep imports into auth internals |
| user | user-detail projection, relation search, entitlement history filters, cancellation review workflow | a separate user package outside `packages/features/account` |
| settings | policy presets, per-channel notification defaults, environment-driven locked setting keys | host-only settings state that bypasses `SettingsResponse` |
| messages | provider receipts, retry dashboards, richer support/consultation thread metadata, release-accepted polling intervals | unbounded realtime claims before a non-polling provider exists |
| payment | gateway adapters, merchant diagnostics, more after-sales states, reconciliation reports | live secrets or merchant credentials in tracked source |
| content | moderation reasons, editorial lanes, attachment governance, authoring audit history | a parallel content stack outside discover/feed/content domains |
| search | domain-specific ranking strategies, synonym/correction dictionaries, persisted recent-search pruning | caller-local search result wrappers |
| list | reusable table/grid render metadata, saved filters, batch action descriptors | bespoke pagination shapes per feature |
| detail | shared comment/attachment/action descriptors, stale-detail recovery copy | one-off detail status enums |
| form | reusable upload-backed field workflows, draft recovery policies, approval templates | ad hoc duplicate-submit flags outside `FormSubmitState` |
| upload | production storage adapter metadata, malware/review annotations, lifecycle cleanup reports | direct host globals from shared packages |
| share | production short-link/poster adapters, campaign attribution rules, invite conversion reports | route maps or attribution wrappers recreated in host apps |
| feedback | SLA rules, queue dashboards, support-thread handoff summaries, operator handling reports | feedback-specific message delivery outside the messages touchpoint model |

## Current Implementation Notes

These repo-level follow-ups are already reflected in current code:

- `0249`: user and settings summaries are aligned across contracts, API, and shared controllers
- `0250`: discover and content-search outputs are aligned across API and shared feed controller state
- `0251`: no new page-protocol gap is open after the recent account, settings, and discover updates
- `0252`: messages, share, upload, and feedback now share one nested context envelope
- `0256`: future content and discover growth is now explicitly constrained to additive extensions of the current shared content, search, upload, and feedback stack
- `0257`: future account and relationship growth is now explicitly constrained to the shared account workspace and canonical account outputs
- `0258`: capability posture is now surfaced through shared feature-state summaries instead of relying on host-local fallback copy
- `0278`: shared list protocol now carries render metadata, saved-filter descriptors, and batch-action descriptors without changing the canonical pagination and selection outputs

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
| `P0` | [`../tasks/cards/done/0247-release-follow-up-queue-coordination.md`](../tasks/cards/done/0247-release-follow-up-queue-coordination.md) | keep rollout order, blockers, and closeout criteria explicit | [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md), [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md) |
| `P0` | [`../tasks/cards/active/0241-auth-provider-operator-rollout.md`](../tasks/cards/active/0241-auth-provider-operator-rollout.md) | close auth provider rollout and callback readiness | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md) | close external message-provider rollout and explicit polling acceptance | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`](../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md) | close merchant, callback, and reconciliation rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`](../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md) | close upload provider and asset-host rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`](../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md) | close short-link and poster rollout | [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |
| `P0` | [`../tasks/cards/active/0246-release-execution-and-signoff.md`](../tasks/cards/active/0246-release-execution-and-signoff.md) | capture final release decision and signoff | [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md) |

Repo-side posture for this queue:

- `/ops/diagnostics` is now the shared readiness checkpoint for auth, messages, payment callbacks, upload, and share
- `PRODUCTION_READINESS`, `RELEASE_RUNBOOK`, and `VERIFICATION_LOG` now define the minimum evidence shape for `0241` to `0246`
- the remaining work is still operator execution, not missing shared-kernel behavior

## Execution Order

Use this order unless a release owner explicitly decides otherwise:

1. Confirm the closed `0247` coordination baseline still matches the target owners, environments, and evidence locations.
2. `0241` to `0245` close provider-specific rollout and acceptance in parallel where possible.
3. `0246` closes only after the provider tracks and manual validation evidence are recorded.

## Ownership Split

- Product: confirm degraded-mode acceptance and any explicit release exceptions
- Backend: own provider configuration, callback posture, and API-side rollout
- Frontend: validate host-visible behavior against normalized shared outputs
- Release: keep `PRODUCTION_READINESS`, `RELEASE_RUNBOOK`, and `VERIFICATION_LOG` synchronized
