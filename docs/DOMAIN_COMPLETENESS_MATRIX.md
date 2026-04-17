# Domain Completeness Matrix

This matrix turns the current repository audit into an execution-oriented view for the shared business domains:

- which files currently own the domain
- which official hosts expose user-visible entry points
- which host entry points are still missing
- which follow-up card should close the remaining gap

Status labels:

- `implemented`: contracts, API, shared feature logic, and tests are in place
- `partial`: domain works in shared code or selected hosts, but host adoption or production hardening is incomplete
- `host-missing`: core capability exists, but one or more official hosts do not expose it yet
- `sample-provider`: domain still depends on explicit sample or mock-style provider behavior

| Order | Domain | Current Status | Main Files | Existing Page Entry Points | Missing Page Entry Points | Suggested Follow-up Card |
|---|---|---|---|---|---|---|
| 1 | Login | `partial`, `sample-provider` | `packages/contracts/src/api/auth.ts`, `packages/features/auth/src/controller/index.ts`, `apps/api/src/domains/auth/routes.ts`, `packages/core/src/runtime/auth.ts` | `apps/host-h5:/` with explicit guest entry posture, `apps/host-wechat:/pages/login/index` with explicit `wx.login` posture, `apps/novel-h5:/login`, `apps/novel-wechat:/pages/login/index`, plus identity pages on `host-h5` and `host-wechat` | official hosts now expose SMS and OAuth readiness plus recovery/callback posture directly on the login surface. SMS and OAuth production modes both fail closed unless real providers are injected, so the remaining gap is operator-owned provider rollout rather than another repo flow gap | `0241-auth-provider-operator-rollout.md` |
| 2 | User | `implemented` | `packages/contracts/src/api/user.ts`, `packages/features/account/src/controller/index.ts`, `apps/api/src/domains/account/routes.ts`, `apps/api/src/domains/account/routes.identity.ts`, `apps/api/src/domains/account/routes.relations.ts` | `apps/host-h5:/account`, `apps/host-wechat:/pages/account/index`, `apps/novel-h5:/account`, `apps/novel-wechat:/pages/account/index` | official hosts now treat the shared account center as the canonical user surface; profile, relation, and asset detail stay intentionally embedded there and in search-driven entry points instead of adding a dedicated user-detail route | `—` |
| 3 | Settings | `implemented` | `packages/contracts/src/api/settings.ts`, `packages/features/settings/src/controller/index.ts`, `apps/api/src/domains/settings/routes.ts`, `apps/api/src/domains/settings/state.ts` | `apps/host-h5:/preferences`, `apps/host-wechat:/pages/settings/index`, `apps/novel-h5:/preferences`, `apps/novel-wechat:/pages/settings/index` | official hosts now share the same settings-summary posture, effective-policy projection, notification-channel model, and locked-setting visibility; remaining route differences are intentional downstream-domain entry choices such as order-center and studio surfaces | `—` |
| 4 | Messages | `partial`, `sample-provider` | `packages/contracts/src/api/message.ts`, `packages/features/messages/src/controller/index.ts`, `apps/api/src/domains/messages/routes.ts`, `apps/api/src/domains/messages/touchpoints.ts` | `apps/host-h5:/inbox`, `apps/host-wechat:/pages/messages/index`, `apps/novel-h5:/inbox`, `apps/novel-wechat:/pages/messages/index` | host exposure is closed; transport remains intentionally polling-only, provider posture is explicit in settings and inbox state, and the remaining gap is operator-owned rollout of real external providers | `0242-message-provider-rollout-and-polling-acceptance.md` |
| 5 | Payment | `partial`, `sample-provider` | `packages/contracts/src/api/payment.ts`, `packages/features/subscription/src/controller/index.ts`, `apps/api/src/domains/payment/routes.ts`, `apps/api/src/domains/payment/routes.commerce.ts`, `apps/api/src/domains/payment/routes.callbacks.ts`, `apps/api/src/domains/payment/routes.after-sales.ts` | `apps/host-h5:/membership`, `/orders`, `apps/host-wechat:/pages/membership/index`, `/pages/orders/index`, `apps/novel-h5:/membership`, `apps/novel-wechat:/pages/membership/index` | generic hosts now expose a dedicated order-center route while novel hosts intentionally stay on the membership-centered reading flow; production-mode gateway parameters, callback verification, reconciliation, and host-safe copy are wired, so the remaining gap is operator-owned merchant rollout rather than another repo flow gap | `0243-payment-merchant-rollout-and-callback-ops.md` |
| 6 | Content | `partial` | `packages/contracts/src/api/content.ts`, `packages/features/feed/src/controller/index.ts`, `packages/features/catalog/src/controller/index.ts`, `packages/features/novel-detail/src/controller/index.ts`, `apps/api/src/domains/content/routes.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index` for managed content/search and bounded studio state, `apps/novel-h5:/discover`, `/`, `/books`, `/novel/detail`, `/reader`, `apps/novel-wechat:/pages/feed/index`, `/pages/catalog/index`, `/pages/novelDetail/index`, `/pages/reader/index` | the official-sample decision is now explicit: there is no separate CMS-only page, and managed-content draft/review stays routeable through the shared discover/feed surface instead of a host-local studio | `—` |
| 7 | Search | `implemented` | `packages/contracts/src/api/search.ts`, `packages/features/feed/src/controller/index.ts`, `apps/api/src/domains/content/feed.ts`, `apps/api/src/domains/content/search.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index`, `apps/novel-h5:/discover`, `apps/novel-wechat:/pages/feed/index` | shared search now keeps one discover entry across hosts while explicitly tuning typo recovery, keyword-aware ranking, and all-domain result blending without reopening route structure | `—` |
| 8 | List | `implemented` | `packages/core/src/page-protocols/list.ts`, direct adopters in `packages/features/items`, `messages`, `feed`; embedded `ListStatus` adoption in `subscription` | `apps/host-h5:/items`, `/discover`, `/inbox`, `/orders`; `apps/host-wechat:/pages/items/index`, `/pages/feed/index`, `/pages/messages/index`, `/pages/orders/index`; `apps/novel-h5:/discover`, `/inbox`; `apps/novel-wechat:/pages/feed/index`, `/pages/messages/index` | no blocked host route remains; embedded exceptions are already documented | `—` |
| 9 | Detail | `implemented` | `packages/core/src/page-protocols/detail.ts`, direct adopters in `packages/features/novel-detail`; embedded `DetailStatus` adoption in `messages` and `subscription` | `apps/novel-h5:/novel/detail`, `/reader`; `apps/novel-wechat:/pages/novelDetail/index`, `/pages/reader/index`; embedded thread/order detail in `host-h5` and `host-wechat` inbox and membership flows | no blocked host route remains; immersive-runtime and embedded-detail exceptions are already documented | `—` |
| 10 | Form | `implemented` | `packages/core/src/page-protocols/form.ts`, direct adopters in `packages/features/account`, `feedback`, `feed` | `apps/host-h5:/account`, `/feedback`, `/discover`; `apps/host-wechat:/pages/account/index`, `/pages/feedback/index`, `/pages/feed/index` | no blocked kernel work remains; explicit credential and action-workflow exceptions are already documented | `—` |
| 11 | Upload | `partial`, `sample-provider` | `packages/contracts/src/api/upload.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/uploads/routes.ts`, `apps/api/src/domains/uploads/pipeline.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index`, `apps/novel-h5:/media-tools`, `apps/novel-wechat:/pages/mediaTools/index`, indirect attachment use in feedback and discover flows | no blocked host route remains; review/storage provider posture is explicit and production-safe in the returned metadata, and the remaining gap is operator-owned rollout of the actual object storage and review backends | `0244-upload-provider-rollout-and-asset-host-cutover.md` |
| 12 | Share | `partial`, `sample-provider` | `packages/contracts/src/api/share.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/share/routes.ts`, `apps/api/src/domains/share/attribution.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index`, `apps/novel-h5:/media-tools`, `apps/novel-wechat:/pages/mediaTools/index` | no blocked host route remains; short-link and poster provider posture is now explicit and production-safe in returned metadata, and the remaining gap is operator-owned rollout of the actual short-link and poster backends | `0245-share-provider-rollout-and-attribution-ops.md` |
| 13 | Feedback | `implemented` | `packages/contracts/src/api/feedback.ts`, `packages/features/feedback/src/controller/index.ts`, `apps/api/src/domains/feedback/routes.ts`, `apps/api/src/domains/feedback/support.ts` | `apps/host-h5:/feedback`, `apps/host-wechat:/pages/feedback/index`, `apps/novel-h5:/feedback`, `apps/novel-wechat:/pages/feedback/index` | no blocked host route remains; novel hosts now expose the shared feedback and support entry surface directly | `—` |

## Expanded Functional Matrix

This section expands each domain beyond route ownership and host exposure so future contract or feature work can track:

- the expected capability slices inside the domain
- the shared workflow or state transitions that must stay explicit
- the main cross-domain coordination points
- the normalized outputs that host surfaces should be able to consume

| Domain | Expanded Capability Scope | Workflow and State Model | Cross-domain Coordination | Common Outputs |
|---|---|---|---|---|
| Login | WeChat code login, phone verification-code login, password login, guest posture, reserved OAuth login and bind entry | login, refresh, logout, silent renewal, session restore, expiry handling, guest upgrade, phone binding, account merge, forced relogin | auth guard, login redirect restore, source-page passthrough, device identity, risk fields, rate limiting, abnormal-login prompt | `session`, `identity`, `authStatus`, `redirectTarget` |
| User | profile, account summary, identity bindings, real-name posture, assets, levels, membership, relationship graph, blacklist and remark-name posture | enabled, frozen, cancellation-in-progress, blacklisted, guest, merged-account recovery posture | login identity, payment entitlements, settings edits, feedback context, search-by-user, relation-driven exposure | `userProfile`, `accountSummary`, `userStatus` |
| Settings | language, theme, font size, notification toggles, privacy toggles, cache and network policy, autoplay, weak-network mode, account actions, debug and experiment switches | bootstrap defaults, persisted preferences, local override vs server sync, versioned migration, environment/debug visibility, policy lock posture | user profile edits, login security posture, reader or content preference writes, message delivery switches, upload/share degraded-mode controls | `preferences`, `featureToggles`, `privacyOptions` |
| Messages | system notifications, business notifications, activity notices, review notices, private threads, consultation threads, support threads, reserved group-chat posture | unread count, read receipt, sticky threads, do-not-disturb, polling or sync mode, pagination, grouped sections, batch read | login-required inbox access, feedback/support loop, content or order notifications, subscription-message or push abstraction | `notificationList`, `messageThread`, `unreadBadge` |
| Payment | order creation, pending and paid flows, close, cancel, refund, membership purchase, subscription goods, one-time virtual goods, value-added services | intent creation, callback verification, state polling, duplicate-pay protection, entitlement activation, reconciliation and refund lifecycle | login identity, content access unlock, user assets, order-center list/detail, risk-control and provider configuration | `order`, `paymentIntent`, `paymentResult`, `entitlement` |
| Content | article, course, consultation service, tool configuration, post, event, labels, categories, topics, recommendation slots, featured and pinned posture | draft, published, offline, under-review, rejected, updated, archived, deleted, restored, access-gated visibility | search indexing, list and detail rendering, payment entitlement checks, share landing pages, feedback or report linkage | `contentCard`, `contentDetail`, `contentAccess` |
| Search | keyword search, suggestions, search history, hot terms, title/body/tag/author/category/location dimensions, typo recovery, no-result posture | recent-history persistence, parameter write-back to route, pagination, filter state, sort state, scoped search vs global search | content, user, order, and message entry surfaces; list state recovery; analytics and recommendation feedback loops | `searchQuery`, `searchFilters`, `searchResults` |
| List | feed, table, card stream, grid, grouped list, pull-to-refresh, append pagination, incremental update, retry, skeleton, partial-data posture | loading, empty, error, partial, restoring, selected-item recovery, sticky headers, batch selection, sort and filter switching | content feeds, order lists, inbox lists, consultation history, search result containers, detail back-navigation continuity | `items`, `pagination`, `filters`, `selectedItemId` |
| Detail | content detail, order detail, user detail, consultation detail, tool-result detail, related blocks, comments, attachments, operation bar | loading, refresh, stale, deleted, unavailable, forbidden, offline, share-entry recovery, deep-link recovery, action availability | list-to-detail continuity, share-to-detail restore, payment and consult actions, favorite and like posture, edit or delete gating | `detailData`, `detailStatus`, `detailActions` |
| Form | registration, login completion, consultation booking, payment confirmation, content publishing, feedback submission, step forms, approval forms, conditional fields | draft save, final submit, duplicate-submit protection, sync and async validation, dynamic fields, conditional reveal, result-page handoff | login identity completion, content authoring, payment confirmation, upload attachment binding, feedback context capture | `formValues`, `validationErrors`, `submitState` |
| Upload | image, audio, video, PDF, avatar, attachment; compression, reserved chunking, progress, retry, cancel, preview, derived metadata | size/type validation, moderation posture, expiry cleanup, thumbnail or cover extraction, upload failure classification | content authoring, feedback screenshots, user avatar updates, share-poster assets, platform-specific picker behavior | `uploadTask`, `uploadAsset`, `uploadError` |
| Share | page share, content share, invite share, event-poster share, WeChat session, timeline, copy link, poster image, short-link and channel markers | attribution capture, callback or return recognition, conversion-source recovery, poster generation, channel-specific degradation | content landing, growth and referral loops, auth callback binding, media-tools workspace, payment or campaign conversion measurement | `sharePayload`, `shareChannel`, `shareAttribution` |
| Feedback | problem reports, suggestions, complaints, abuse reports, satisfaction surveys, FAQ handoff, support tickets, processing-progress visibility | ticket creation, status progression, callback or revisit posture, screenshot attachment context, category and priority routing, revisit tagging | account identity, device and version context, payment/content/order issue routing, message/support follow-up, moderation workflows | `feedbackTicket`, `feedbackCategory`, `feedbackStatus` |

## Cross-domain Dependency Notes

Use these dependency rules when deciding whether a change belongs in `contracts`, `core`, a feature package, or only a host surface:

- `login` is the source domain for route guards, redirect restore, and identity upgrade; avoid reimplementing auth-state transitions in downstream features.
- `user` and `settings` should stay the profile-and-preference center of gravity; downstream domains may project summaries, but should not fork profile or preference state models.
- `user` summary surfaces should preserve session-derived posture together with remote `identityWorkflows` and `securityCenter` extensions instead of replacing one with the other during hydration.
- `settings` summary surfaces should preserve one shared model carrying `preferences`, `featureToggles`, `privacyOptions`, plus the policy extensions `effectivePolicy`, `notificationChannels`, and `lockedSettingKeys`.
- `messages`, `feedback`, and `share` all collect cross-domain context; normalize identifiers and route metadata in shared contracts instead of inventing per-domain envelope shapes.
- `payment` and `content` jointly decide entitlement and access; access gating should remain explicit in contracts instead of being implied by page-local booleans.
- `search`, `list`, `detail`, and `form` are cross-domain interaction protocols; prefer extending shared page-state primitives before adding one-off workflow flags.
- `upload` is infrastructure-like but still business-visible; provider mode, moderation status, and derived asset metadata should remain inspectable in returned payloads.

## Implementation Mapping Matrix

Use this table when converting a domain idea into repo-local changes. Start from the leftmost stable layer and only move right when the shared surface truly requires it.

| Domain | Primary Contract Files | Primary Feature Or Runtime Owners | Primary API Domain Files | Host Route Families |
|---|---|---|---|---|
| Login | `packages/contracts/src/api/auth.ts` | `packages/features/auth/src/index.ts`, `packages/core/src/runtime/auth.ts`, `packages/core/src/runtime/session.ts`, `packages/core/src/runtime/auth-redirect.ts` | `apps/api/src/domains/auth/routes.ts`, `apps/api/src/domains/auth/provider.ts`, `apps/api/src/domains/auth/security.ts`, `apps/api/src/domains/auth/session.ts` | `host-h5:/`, `host-wechat:/pages/login/index`, `novel-h5:/login`, `novel-wechat:/pages/login/index`, plus identity routes on generic hosts |
| User | `packages/contracts/src/api/user.ts` | `packages/features/account/src/index.ts` | `apps/api/src/domains/account/routes.ts`, `apps/api/src/domains/account/routes.identity.ts`, `apps/api/src/domains/account/routes.relations.ts`, `apps/api/src/domains/account/profile.ts`, `apps/api/src/domains/account/current-user.ts` | `host-h5:/account`, `host-wechat:/pages/account/index`, `novel-h5:/account`, `novel-wechat:/pages/account/index` |
| Settings | `packages/contracts/src/api/settings.ts` | `packages/features/settings/src/index.ts`, `packages/core/src/store/settings.ts` | `apps/api/src/domains/settings/routes.ts`, `apps/api/src/domains/settings/state.ts` | `host-h5:/preferences`, `host-wechat:/pages/settings/index`, `novel-h5:/preferences`, `novel-wechat:/pages/settings/index` |
| Messages | `packages/contracts/src/api/message.ts` | `packages/features/messages/src/index.ts`, shared list and detail protocols in `packages/core/src/page-protocols` | `apps/api/src/domains/messages/routes.ts`, `apps/api/src/domains/messages/threads.ts`, `apps/api/src/domains/messages/notifications.ts`, `apps/api/src/domains/messages/touchpoints.ts` | `host-h5:/inbox`, `host-wechat:/pages/messages/index`, `novel-h5:/inbox`, `novel-wechat:/pages/messages/index` |
| Payment | `packages/contracts/src/api/payment.ts`, `packages/contracts/src/api/membership.ts` | `packages/features/subscription/src/index.ts`, embedded list and detail protocol adoption in `packages/core/src/page-protocols` | `apps/api/src/domains/payment/routes.ts`, `apps/api/src/domains/payment/routes.commerce.ts`, `apps/api/src/domains/payment/routes.after-sales.ts`, `apps/api/src/domains/payment/routes.callbacks.ts`, `apps/api/src/domains/payment/orders.ts`, `apps/api/src/domains/payment/subscriptions.ts` | `host-h5:/membership`, `/orders`; `host-wechat:/pages/membership/index`, `/pages/orders/index`; `novel-h5:/membership`; `novel-wechat:/pages/membership/index` |
| Content | `packages/contracts/src/api/content.ts`, `packages/contracts/src/api/feed.ts`, `packages/contracts/src/api/novels.ts`, `packages/contracts/src/api/novel-detail.ts`, `packages/contracts/src/api/chapters.ts`, `packages/contracts/src/api/bookshelf.ts`, `packages/contracts/src/api/reading-progress.ts` | `packages/features/feed/src/index.ts`, `packages/features/catalog/src/index.ts`, `packages/features/novel-detail/src/index.ts`, `packages/features/reader/src/index.ts`, `packages/features/bookshelf/src/index.ts`, `packages/features/toc/src/index.ts` | `apps/api/src/domains/content/routes.ts`, `apps/api/src/domains/content/feed.ts`, `apps/api/src/domains/content/novels.ts`, `apps/api/src/domains/content/managed-content.ts` | `host-h5:/discover`; `host-wechat:/pages/feed/index`; `novel-h5:/`, `/discover`, `/books`, `/novel/detail`, `/reader`; `novel-wechat:/pages/feed/index`, `/pages/catalog/index`, `/pages/novelDetail/index`, `/pages/reader/index` |
| Search | `packages/contracts/src/api/search.ts`, supporting search fields in `packages/contracts/src/api/content.ts` | `packages/features/feed/src/index.ts`, `packages/core/src/runtime/search.ts` | `apps/api/src/domains/content/search.ts`, `apps/api/src/domains/content/feed.ts` | `host-h5:/discover`, `host-wechat:/pages/feed/index`, `novel-h5:/discover`, `novel-wechat:/pages/feed/index` |
| List | shared list state in `packages/core/src/page-protocols/list.ts` plus domain-specific contracts such as `items`, `message`, `payment`, `content` | `packages/features/items/src/index.ts`, `packages/features/feed/src/index.ts`, `packages/features/messages/src/index.ts`, `packages/features/subscription/src/index.ts` | domain list endpoints under `apps/api/src/domains/items`, `content`, `messages`, and `payment` | `host-h5:/items`, `/discover`, `/inbox`, `/orders`; `host-wechat:/pages/items/index`, `/pages/feed/index`, `/pages/messages/index`, `/pages/orders/index`; novel discover and inbox surfaces |
| Detail | shared detail state in `packages/core/src/page-protocols/detail.ts` plus domain-specific contracts such as `novel-detail`, `payment`, `message`, `user` | `packages/features/novel-detail/src/index.ts`, `packages/features/messages/src/index.ts`, `packages/features/subscription/src/index.ts` | domain detail endpoints under `apps/api/src/domains/content`, `messages`, `payment`, and `account` | novel detail and reader routes, plus embedded thread and order detail in generic-host inbox and commerce routes |
| Form | shared form state in `packages/core/src/page-protocols/form.ts` plus `auth`, `feedback`, `content`, and `user` contracts | `packages/features/account/src/index.ts`, `packages/features/feedback/src/index.ts`, `packages/features/feed/src/index.ts`, auth credential flows in `packages/features/auth/src/index.ts` | API mutation endpoints under `apps/api/src/domains/auth`, `feedback`, `content`, `account`, and `payment` | account, feedback, discover authoring, login, identity, and commerce-confirmation surfaces |
| Upload | `packages/contracts/src/api/upload.ts` | `packages/features/media-tools/src/index.ts` | `apps/api/src/domains/uploads/routes.ts`, `apps/api/src/domains/uploads/pipeline.ts` | `host-h5:/media-tools`, `host-wechat:/pages/mediaTools/index`, `novel-h5:/media-tools`, `novel-wechat:/pages/mediaTools/index`, plus embedded attachment flows |
| Share | `packages/contracts/src/api/share.ts` | `packages/features/media-tools/src/index.ts` | `apps/api/src/domains/share/routes.ts`, `apps/api/src/domains/share/attribution.ts` | `host-h5:/media-tools`, `host-wechat:/pages/mediaTools/index`, `novel-h5:/media-tools`, `novel-wechat:/pages/mediaTools/index` |
| Feedback | `packages/contracts/src/api/feedback.ts` | `packages/features/feedback/src/index.ts` | `apps/api/src/domains/feedback/routes.ts`, `apps/api/src/domains/feedback/support.ts`, `apps/api/src/domains/feedback/tickets.ts` | `host-h5:/feedback`, `host-wechat:/pages/feedback/index`, `novel-h5:/feedback`, `novel-wechat:/pages/feedback/index` |

## Priority Follow-up Queue

This queue is intentionally narrower than the expanded capability list above. It focuses on follow-up work that still fits the frozen `v1.0` sample surface rather than opening new product breadth.

| Priority | Candidate Slice | Why It Matters | Likely Owned Files | Suggested Gate |
|---|---|---|---|---|
| `P0` | [`0247-release-follow-up-queue-coordination.md`](../tasks/cards/active/0247-release-follow-up-queue-coordination.md) | auth, messages, payment, upload, and share still depend on operator-owned production rollout even though repo posture is closed | `docs/DOMAIN_COMPLETENESS_MATRIX.md`, `tasks/cards/active/0241-0246` | `pnpm verify:release` plus recorded manual validation |
| `P1` | [`0248-shared-output-envelope-normalization-audit.md`](../tasks/cards/active/0248-shared-output-envelope-normalization-audit.md) | the expanded matrix now names canonical outputs, but not every domain documents the exact cross-host output shape and recovery metadata at the same level of detail | `docs/BACKEND_CONTRACT.md`, `packages/contracts/src/api/*.ts`, selected feature controllers | `pnpm verify` |
| `P1` | [`0249-user-and-settings-summary-alignment.md`](../tasks/cards/active/0249-user-and-settings-summary-alignment.md) | account, identity, preference, and debug posture are exposed across multiple hosts and should keep one shared summary model instead of host-local projections drifting | `packages/contracts/src/api/user.ts`, `packages/contracts/src/api/settings.ts`, `packages/features/account`, `packages/features/settings`, account and settings host surfaces | `pnpm verify:feature account`, `pnpm verify:feature settings` |
| `P1` | [`0250-content-search-and-discover-output-alignment.md`](../tasks/cards/active/0250-content-search-and-discover-output-alignment.md) | discover is already the shared cross-host entry, so ranking, filter persistence, content-card shape, and managed-content draft posture should stay contract-led instead of host-led | `packages/contracts/src/api/content.ts`, `feed.ts`, `search.ts`, `packages/features/feed`, `packages/features/catalog`, `apps/api/src/domains/content/*` | `pnpm verify:feature feed` |
| `P2` | [`0251-page-protocol-adoption-gap-audit-refresh.md`](../tasks/cards/active/0251-page-protocol-adoption-gap-audit-refresh.md) | list, detail, and form protocol notes are present, but future changes can silently regress into feature-local flags unless the audit is refreshed after larger controller work | `docs/DOMAIN_COMPLETENESS_MATRIX.md`, `packages/core/src/page-protocols/*`, affected feature packages | `pnpm verify` |
| `P2` | [`0252-cross-domain-context-envelope-audit.md`](../tasks/cards/active/0252-cross-domain-context-envelope-audit.md) | these domains all capture route, asset, and actor context; inconsistent envelopes would create avoidable host-specific adapters later | `packages/contracts/src/api/message.ts`, `share.ts`, `upload.ts`, `feedback.ts`, corresponding API domains and feature controllers | `pnpm verify` |

Current repository posture for `0249`:

- shared account controllers now retain session-derived summary items while projecting remote `userProfile`, `accountSummary`, `userStatus`, `identityWorkflows`, and `securityCenter` into one stable account-center surface
- shared settings controllers now retain `preferences`, `featureToggles`, `privacyOptions`, `effectivePolicy`, `notificationChannels`, and `lockedSettingKeys` on `SettingsPageModel`, including shared summary and locked-setting sections
- remaining follow-up under `0249` is documentation and exception hygiene rather than another host-surface gap

Current repository posture for `0250`:

- the default discover lane and cross-domain discover lane now expose one shared filter vocabulary, including explicit domain metadata even when `domain = feed`
- `searchResults.activeDomain`, `domainTabs`, and `resultGroups` are now carried consistently enough that hosts do not need separate discover-state branches for feed-only versus cross-domain search
- managed-content draft and lifecycle mutations now keep outer discover cards synchronized with nested `contentCard` and `contentAccess` payloads, including grouped search-result copies
- remaining follow-up under `0250` is documentation and intentional novel-only exception hygiene rather than another discover-route gap

Current repository posture for `0251`:

- no new protocol-adoption gap was found in `account`, `settings`, or `discover`; the recent controller work stayed inside existing `ListPageState`, `DetailPageState`, and `FormPageState` boundaries rather than inventing replacement status models
- the main explicit exceptions remain embedded commerce detail, embedded inbox detail, embedded discover authoring, and nested account relation or ledger collections
- account and settings summary-center work is an intentional non-protocol surface, not a hidden list/detail/form regression, because those pages expose shared summary workspaces rather than route-root list/detail documents

Current repository posture for `0252`:

- messages, share, upload, and feedback now share the same nested context vocabulary through `sourceContext` and `actorContext` instead of mixing route or actor metadata into ad hoc flat fields
- feedback propagates the captured context into linked support threads and upload-reference binding, so support-loop coordination no longer needs a host-local provenance bridge
- share preparation, upload attachment, and message-thread creation now preserve route and actor provenance in portable contract fields rather than per-domain wrappers
- remaining follow-up under `0252` is documentation and domain-specific extension hygiene rather than another shared contract mismatch

### Queue Rules

- `P0` follow-ups should not broaden the product surface; they should only close release, provider, and rollout posture for the frozen samples.
- `P1` follow-ups may normalize shared contracts or feature outputs when that reduces drift across the four official hosts.
- `P2` follow-ups should be audit or hygiene slices unless a higher-priority regression pulls them forward.
- If a proposed change needs a new top-level package, a new host family, or a new broad UI abstraction, it is outside this queue and should first reopen scope in `README.md`, `docs/ROADMAP.md`, and `docs/ARCHITECTURE.md`.

## Recommended Execution Order

Use the active cards in this order unless a release-blocking regression forces a different path:

1. [`0247-release-follow-up-queue-coordination.md`](../tasks/cards/active/0247-release-follow-up-queue-coordination.md)
   Establish the queue owner, the bundle-level closeout criteria, and the dependency view across `0241` through `0246` before the release rollout starts drifting into parallel undocumented work.
2. `0241` through `0246` as one `P0` rollout bundle
   Execute auth, messages, payment, upload, share, and final release signoff as the production-rollout path for the frozen `v1.0` sample surface. These cards may run in parallel operationally, but they should report through the coordination posture defined by `0247`.
3. [`0248-shared-output-envelope-normalization-audit.md`](../tasks/cards/active/0248-shared-output-envelope-normalization-audit.md)
   Normalize the shared vocabulary for domain outputs before touching narrower feature slices. This is the baseline contract audit that keeps `0249`, `0250`, and `0252` from solving the same naming drift independently.
4. [`0249-user-and-settings-summary-alignment.md`](../tasks/cards/active/0249-user-and-settings-summary-alignment.md) and [`0250-content-search-and-discover-output-alignment.md`](../tasks/cards/active/0250-content-search-and-discover-output-alignment.md)
   Run these after `0248` because they are feature-focused normalizations built on top of the shared envelope vocabulary. They can proceed in parallel if ownership stays disjoint.
5. [`0252-cross-domain-context-envelope-audit.md`](../tasks/cards/active/0252-cross-domain-context-envelope-audit.md)
   Audit context-heavy envelopes after the core output vocabulary is stable, so route, actor, and asset metadata can be normalized against the same field language.
6. [`0251-page-protocol-adoption-gap-audit-refresh.md`](../tasks/cards/active/0251-page-protocol-adoption-gap-audit-refresh.md)
   Run the protocol adoption audit last so it can evaluate the post-normalization state of controllers and shared outputs instead of auditing a surface that is about to change underneath it.

### Parallelism Notes

- `0241` through `0246` may advance in parallel because they are operator-owned rollout tracks, but `0247` should remain the coordination source of truth.
- `0249` and `0250` are the best parallel engineering pair after `0248` completes because one targets account or settings summaries and the other targets discover or content-search outputs.
- `0251` should not start before `0249` and `0250` settle, otherwise the audit will mostly record known temporary drift.
- `0252` may overlap the end of `0249` or `0250` if the shared output vocabulary from `0248` is already stable.

## Owner Checklist

Use this checklist to assign the active queue by delivery function instead of only by card number.

### Product

- own the release acceptance posture for [`0247-release-follow-up-queue-coordination.md`](../tasks/cards/active/0247-release-follow-up-queue-coordination.md) and [`0246-release-execution-and-signoff.md`](../tasks/cards/active/0246-release-execution-and-signoff.md)
- confirm whether polling-only message sync remains acceptable for [`0242-message-provider-rollout-and-polling-acceptance.md`](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md)
- confirm the canonical domain outputs named in [`0248-shared-output-envelope-normalization-audit.md`](../tasks/cards/active/0248-shared-output-envelope-normalization-audit.md)
- sign off on intentional user, settings, content, and discover exceptions documented by [`0249-user-and-settings-summary-alignment.md`](../tasks/cards/active/0249-user-and-settings-summary-alignment.md) and [`0250-content-search-and-discover-output-alignment.md`](../tasks/cards/active/0250-content-search-and-discover-output-alignment.md)
- review any explicit protocol or context-envelope exceptions surfaced by [`0251-page-protocol-adoption-gap-audit-refresh.md`](../tasks/cards/active/0251-page-protocol-adoption-gap-audit-refresh.md) and [`0252-cross-domain-context-envelope-audit.md`](../tasks/cards/active/0252-cross-domain-context-envelope-audit.md)

### Backend

- own provider and environment rollout for [`0241-auth-provider-operator-rollout.md`](../tasks/cards/active/0241-auth-provider-operator-rollout.md), [`0243-payment-merchant-rollout-and-callback-ops.md`](../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md), [`0244-upload-provider-rollout-and-asset-host-cutover.md`](../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md), and [`0245-share-provider-rollout-and-attribution-ops.md`](../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md)
- own external delivery and fallback posture for [`0242-message-provider-rollout-and-polling-acceptance.md`](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md)
- drive contract and API-domain normalization in [`0248-shared-output-envelope-normalization-audit.md`](../tasks/cards/active/0248-shared-output-envelope-normalization-audit.md)
- drive account, settings, content, and discover output alignment in [`0249-user-and-settings-summary-alignment.md`](../tasks/cards/active/0249-user-and-settings-summary-alignment.md) and [`0250-content-search-and-discover-output-alignment.md`](../tasks/cards/active/0250-content-search-and-discover-output-alignment.md)
- normalize shared context envelopes in [`0252-cross-domain-context-envelope-audit.md`](../tasks/cards/active/0252-cross-domain-context-envelope-audit.md)

### Frontend

- validate host-visible auth, inbox, account, settings, discover, media-tools, and feedback behavior against the outputs normalized by [`0248-shared-output-envelope-normalization-audit.md`](../tasks/cards/active/0248-shared-output-envelope-normalization-audit.md)
- own shared feature-controller alignment for [`0249-user-and-settings-summary-alignment.md`](../tasks/cards/active/0249-user-and-settings-summary-alignment.md) and [`0250-content-search-and-discover-output-alignment.md`](../tasks/cards/active/0250-content-search-and-discover-output-alignment.md)
- verify host route write-back, route recovery, and embedded-detail behavior before [`0251-page-protocol-adoption-gap-audit-refresh.md`](../tasks/cards/active/0251-page-protocol-adoption-gap-audit-refresh.md) closes
- review message, upload, share, and feedback context capture from a host-consumer point of view during [`0252-cross-domain-context-envelope-audit.md`](../tasks/cards/active/0252-cross-domain-context-envelope-audit.md)
- report any place where host presentation is compensating for a shared contract mismatch instead of a true host-specific requirement

### Release

- run [`0247-release-follow-up-queue-coordination.md`](../tasks/cards/active/0247-release-follow-up-queue-coordination.md) as the source of truth for rollout order, blockers, and closeout criteria
- collect provider, deployment, and manual validation evidence for [`0241-auth-provider-operator-rollout.md`](../tasks/cards/active/0241-auth-provider-operator-rollout.md) through [`0246-release-execution-and-signoff.md`](../tasks/cards/active/0246-release-execution-and-signoff.md)
- keep `docs/PRODUCTION_READINESS.md`, `docs/RELEASE_RUNBOOK.md`, and `docs/VERIFICATION_LOG.md` synchronized as the release-facing evidence set
- require explicit signoff for provider mode, polling acceptance, merchant callback posture, asset host rollout, attribution validation, and final go or no-go
- ensure the release bundle is not marked complete until `0241` through `0246` are all closed and their evidence is reflected in the release docs

### Handoff Points

- Product to Backend:
  confirm the intended output vocabulary and the acceptable degraded or provider-fallback posture before backend contract or rollout work closes.
- Backend to Frontend:
  confirm the final payload shape and any intentional exceptions before frontend starts compensating in host code.
- Frontend to Release:
  provide host-visible validation notes and route-recovery proof for the release evidence set.
- Release to Product:
  surface unresolved rollout exceptions explicitly as go or no-go inputs instead of burying them in execution logs.

## Completed Closure Batch

The host-surface and protocol-adoption closure batch for `0211` through `0223` is complete and has been archived under [`tasks/cards/done`](../tasks/cards/done).

Completion order:

1. `0212` user host surfaces
2. `0213` settings parity
3. `0214` messages host adoption and polling posture hardening
4. `0215` payment host entry closure
5. `0211` login host and provider closure
6. `0216` content surface and CMS entry closure
7. `0217` search center host adoption
8. `0218` list protocol adoption audit
9. `0219` detail protocol adoption audit
10. `0220` form protocol adoption audit
11. `0221` upload host and provider closure
12. `0222` share host and provider closure
13. `0223` feedback host support surface closure

## Notes

- `apps/host-h5` already exposes the broadest business surface: `account`, `discover`, `feedback`, `inbox`, `orders`, and `media-tools`.
- `apps/host-wechat` now exposes the shared official-host surface for `account`, `feed`, `feedback`, `messages`, `orders`, and `media-tools` in addition to `login`, identity pages, `overview`, `items`, and `settings`.
- `apps/novel-h5` and `apps/novel-wechat` now expose bounded shared account, inbox, feedback, and media-tools surfaces in addition to the stronger payment and content-consumption surfaces through `membership`, `catalog`, `novelDetail`, `toc`, `reader`, and `bookshelf`.

## Protocol Adoption Audit

### List Protocol

| Surface | Shared Protocol Posture | Host Entry Points | Notes |
|---|---|---|---|
| Items progress list | direct `ListPageState` adoption in `packages/features/items` | `host-h5:/items`, `host-wechat:/pages/items/index` | canonical list page with loading, refresh, append, partial, and restored selection semantics |
| Feed/search results | direct `ListPageState` adoption in `packages/features/feed` | `host-h5:/discover`, `host-wechat:/pages/feed/index`, `novel-h5:/discover`, `novel-wechat:/pages/feed/index` | shared discover surface is the canonical cross-host list/search entry and now preserves explicit domain filters, route-restorable sort state, grouped search results, and restored selection semantics inside the shared list state instead of host-local flags |
| Inbox notifications | direct `ListPageState` adoption in `packages/features/messages` | `host-h5:/inbox`, `host-wechat:/pages/messages/index`, `novel-h5:/inbox`, `novel-wechat:/pages/messages/index` | keeps unread badge, grouping, thread recovery, and explicit polling posture on top of shared list state |
| Membership order history | embedded `ListStatus` adoption in `packages/features/subscription` | `host-h5:/membership`, `/orders`; `host-wechat:/pages/membership/index`, `/pages/orders/index`; `novel-h5:/membership`; `novel-wechat:/pages/membership/index` | generic hosts now expose the embedded order list through a dedicated order-center route, while novel hosts keep it inside the reading-oriented commerce center |
| Account relations and asset history | explicit nested-domain exception | `host-h5:/account`, `host-wechat:/pages/account/index`, `novel-h5:/account`, `novel-wechat:/pages/account/index` | relation and ledger collections remain subordinate account sections, so forcing a page-root `ListPageState` would duplicate state |

### Detail Protocol

| Surface | Shared Protocol Posture | Host Entry Points | Notes |
|---|---|---|---|
| Novel detail | direct `DetailPageState` adoption in `packages/features/novel-detail` | `novel-h5:/novel/detail`, `novel-wechat:/pages/novelDetail/index` | canonical routeable detail page with deep-link recovery and unavailable handling |
| Message thread detail | embedded `DetailStatus` adoption in `packages/features/messages` | `host-h5:/inbox`, `host-wechat:/pages/messages/index`, `novel-h5:/inbox`, `novel-wechat:/pages/messages/index` | explicit embedded-detail usage inside inbox instead of a separate thread route |
| Commerce order/result detail | embedded `DetailStatus` adoption in `packages/features/subscription` | `host-h5:/membership`, `/orders`; `host-wechat:/pages/membership/index`, `/pages/orders/index`; `novel` membership flows | order, entitlement, callback, and reconciliation detail stay on the shared commerce controller even when generic hosts expose a separate order-center route |
| Reader chapter runtime | explicit immersive-runtime exception | `novel-h5:/reader`, `novel-wechat:/pages/reader/index` | reader optimizes for chapter progress, display preferences, and access continuity rather than generic detail-page semantics |

### Form Protocol

| Surface | Shared Protocol Posture | Host Entry Points | Notes |
|---|---|---|---|
| Account operations | direct `FormPageState` adoption in `packages/features/account` | `host-h5:/account`, `host-wechat:/pages/account/index` | canonical multi-step, draftable, duplicate-protected account workflow |
| Feedback submission | direct `FormPageState` adoption in `packages/features/feedback` | `host-h5:/feedback`, `host-wechat:/pages/feedback/index` | shared validation, attachment context, revisit, and submit lifecycle |
| Managed content draft | embedded `FormPageState` adoption in `packages/features/feed` | `host-h5:/discover`, `host-wechat:/pages/feed/index`, `novel` discover flows | content authoring remains an intentional sub-flow of discover/feed, and official hosts now expose draft/review posture directly on that route instead of implying a missing CMS surface; recent discover output alignment kept this workflow embedded instead of splitting out a host-local studio controller |
| Auth login and identity handoff | explicit credential-workflow exception | `host-h5:/`, `host-wechat:/pages/login/index`, `novel-h5:/login`, `novel-wechat:/pages/login/index` | auth is intentionally modeled as a redirect- and provider-aware login state machine, not a generic draftable form |
| Commerce confirmation actions | explicit action-workflow exception | membership entry points on all official hosts | purchase, cancel, refund, and renew are action confirmations over selected commerce detail, not schema-driven shared forms |

### Explicit Summary Workspace Exceptions

| Surface | Shared Posture | Host Entry Points | Notes |
|---|---|---|---|
| Account center summary | shared summary workspace with embedded `FormPageState` only for account operations | `host-h5:/account`, `host-wechat:/pages/account/index`, `novel-h5:/account`, `novel-wechat:/pages/account/index` | the account center is intentionally not a route-root list/detail page because identity, assets, relations, provider posture, and security posture need one summary model around the embedded operation workflow |
| Settings center summary | shared settings workspace model, not list/detail/form page protocol | `host-h5:/preferences`, `host-wechat:/pages/settings/index`, `novel-h5:/preferences`, `novel-wechat:/pages/settings/index` | settings intentionally projects one summary surface for `preferences`, `featureToggles`, `privacyOptions`, `effectivePolicy`, `notificationChannels`, and `lockedSettingKeys`; this is a domain model decision, not a protocol adoption gap |
