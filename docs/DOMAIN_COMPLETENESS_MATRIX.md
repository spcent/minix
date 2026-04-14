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
| 1 | Login | `partial`, `sample-provider` | `packages/contracts/src/api/auth.ts`, `packages/features/auth/src/controller/index.ts`, `apps/api/src/domains/auth/routes.ts`, `packages/core/src/runtime/auth.ts` | `apps/host-h5:/` with explicit guest entry posture, `apps/host-wechat:/pages/login/index` with explicit `wx.login` posture, `apps/novel-h5:/login`, `apps/novel-wechat:/pages/login/index`, plus identity pages on `host-h5` and `host-wechat` | official hosts now expose SMS and OAuth readiness plus recovery/callback posture directly on the login surface. SMS and OAuth production modes both fail closed unless real providers are injected, so the remaining gap is operator-owned provider rollout rather than another repo flow gap | `—` |
| 2 | User | `implemented` | `packages/contracts/src/api/user.ts`, `packages/features/account/src/controller/index.ts`, `apps/api/src/domains/account/routes.ts`, `apps/api/src/domains/account/routes.identity.ts`, `apps/api/src/domains/account/routes.relations.ts` | `apps/host-h5:/account`, `apps/host-wechat:/pages/account/index`, `apps/novel-h5:/account`, `apps/novel-wechat:/pages/account/index` | official hosts now treat the shared account center as the canonical user surface; profile, relation, and asset detail stay intentionally embedded there and in search-driven entry points instead of adding a dedicated user-detail route | `—` |
| 3 | Settings | `partial` | `packages/contracts/src/api/settings.ts`, `packages/features/settings/src/controller/index.ts`, `apps/api/src/domains/settings/routes.ts`, `apps/api/src/domains/settings/state.ts` | `apps/host-h5:/preferences`, `apps/host-wechat:/pages/settings/index`, `apps/novel-h5:/preferences`, `apps/novel-wechat:/pages/settings/index` | settings exists on all hosts and now routes into the shared account, inbox, feedback, and media-tools surfaces where they exist; remaining intentional differences are downstream-domain gaps such as order-center and studio surfaces | `—` |
| 4 | Messages | `partial`, `sample-provider` | `packages/contracts/src/api/message.ts`, `packages/features/messages/src/controller/index.ts`, `apps/api/src/domains/messages/routes.ts`, `apps/api/src/domains/messages/touchpoints.ts` | `apps/host-h5:/inbox`, `apps/host-wechat:/pages/messages/index`, `apps/novel-h5:/inbox`, `apps/novel-wechat:/pages/messages/index` | host exposure is closed; transport remains intentionally polling-only, provider posture is explicit in settings and inbox state, and the remaining gap is operator-owned rollout of real external providers | `—` |
| 5 | Payment | `partial`, `sample-provider` | `packages/contracts/src/api/payment.ts`, `packages/features/subscription/src/controller/index.ts`, `apps/api/src/domains/payment/routes.ts`, `apps/api/src/domains/payment/routes.commerce.ts`, `apps/api/src/domains/payment/routes.callbacks.ts`, `apps/api/src/domains/payment/routes.after-sales.ts` | `apps/host-h5:/membership`, `/orders`, `apps/host-wechat:/pages/membership/index`, `/pages/orders/index`, `apps/novel-h5:/membership`, `apps/novel-wechat:/pages/membership/index` | generic hosts now expose a dedicated order-center route while novel hosts intentionally stay on the membership-centered reading flow; production-mode gateway parameters, callback verification, reconciliation, and host-safe copy are wired, so the remaining gap is operator-owned merchant rollout rather than another repo flow gap | `—` |
| 6 | Content | `partial` | `packages/contracts/src/api/content.ts`, `packages/features/feed/src/controller/index.ts`, `packages/features/catalog/src/controller/index.ts`, `packages/features/novel-detail/src/controller/index.ts`, `apps/api/src/domains/content/routes.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index` for managed content/search and bounded studio state, `apps/novel-h5:/discover`, `/`, `/books`, `/novel/detail`, `/reader`, `apps/novel-wechat:/pages/feed/index`, `/pages/catalog/index`, `/pages/novelDetail/index`, `/pages/reader/index` | the official-sample decision is now explicit: there is no separate CMS-only page, and managed-content draft/review stays routeable through the shared discover/feed surface instead of a host-local studio | `—` |
| 7 | Search | `implemented` | `packages/contracts/src/api/search.ts`, `packages/features/feed/src/controller/index.ts`, `apps/api/src/domains/content/feed.ts`, `apps/api/src/domains/content/search.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index`, `apps/novel-h5:/discover`, `apps/novel-wechat:/pages/feed/index` | shared search now keeps one discover entry across hosts while explicitly tuning typo recovery, keyword-aware ranking, and all-domain result blending without reopening route structure | `—` |
| 8 | List | `implemented` | `packages/core/src/page-protocols/list.ts`, direct adopters in `packages/features/items`, `messages`, `feed`; embedded `ListStatus` adoption in `subscription` | `apps/host-h5:/items`, `/discover`, `/inbox`, `/orders`; `apps/host-wechat:/pages/items/index`, `/pages/feed/index`, `/pages/messages/index`, `/pages/orders/index`; `apps/novel-h5:/discover`, `/inbox`; `apps/novel-wechat:/pages/feed/index`, `/pages/messages/index` | no blocked host route remains; embedded exceptions are already documented | `—` |
| 9 | Detail | `implemented` | `packages/core/src/page-protocols/detail.ts`, direct adopters in `packages/features/novel-detail`; embedded `DetailStatus` adoption in `messages` and `subscription` | `apps/novel-h5:/novel/detail`, `/reader`; `apps/novel-wechat:/pages/novelDetail/index`, `/pages/reader/index`; embedded thread/order detail in `host-h5` and `host-wechat` inbox and membership flows | no blocked host route remains; immersive-runtime and embedded-detail exceptions are already documented | `—` |
| 10 | Form | `implemented` | `packages/core/src/page-protocols/form.ts`, direct adopters in `packages/features/account`, `feedback`, `feed` | `apps/host-h5:/account`, `/feedback`, `/discover`; `apps/host-wechat:/pages/account/index`, `/pages/feedback/index`, `/pages/feed/index` | no blocked kernel work remains; explicit credential and action-workflow exceptions are already documented | `—` |
| 11 | Upload | `partial`, `sample-provider` | `packages/contracts/src/api/upload.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/uploads/routes.ts`, `apps/api/src/domains/uploads/pipeline.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index`, `apps/novel-h5:/media-tools`, `apps/novel-wechat:/pages/mediaTools/index`, indirect attachment use in feedback and discover flows | no blocked host route remains; review/storage provider posture is explicit and production-safe in the returned metadata, and the remaining gap is operator-owned rollout of the actual object storage and review backends | `—` |
| 12 | Share | `partial`, `sample-provider` | `packages/contracts/src/api/share.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/share/routes.ts`, `apps/api/src/domains/share/attribution.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index`, `apps/novel-h5:/media-tools`, `apps/novel-wechat:/pages/mediaTools/index` | no blocked host route remains; short-link and poster provider posture is now explicit and production-safe in returned metadata, and the remaining gap is operator-owned rollout of the actual short-link and poster backends | `—` |
| 13 | Feedback | `implemented` | `packages/contracts/src/api/feedback.ts`, `packages/features/feedback/src/controller/index.ts`, `apps/api/src/domains/feedback/routes.ts`, `apps/api/src/domains/feedback/support.ts` | `apps/host-h5:/feedback`, `apps/host-wechat:/pages/feedback/index`, `apps/novel-h5:/feedback`, `apps/novel-wechat:/pages/feedback/index` | no blocked host route remains; novel hosts now expose the shared feedback and support entry surface directly | `—` |

## Completed Closure Batch

The host-surface and protocol-adoption closure batch for `0211` through `0223` is complete and has been archived under [`tasks/cards/done`](/Users/bingrong.yan/projects/birdor/minix/tasks/cards/done).

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
| Feed/search results | direct `ListPageState` adoption in `packages/features/feed` | `host-h5:/discover`, `host-wechat:/pages/feed/index`, `novel-h5:/discover`, `novel-wechat:/pages/feed/index` | shared discover surface is the canonical cross-host list/search entry |
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
| Managed content draft | embedded `FormPageState` adoption in `packages/features/feed` | `host-h5:/discover`, `host-wechat:/pages/feed/index`, `novel` discover flows | content authoring remains an intentional sub-flow of discover/feed, and official hosts now expose draft/review posture directly on that route instead of implying a missing CMS surface |
| Auth login and identity handoff | explicit credential-workflow exception | `host-h5:/`, `host-wechat:/pages/login/index`, `novel-h5:/login`, `novel-wechat:/pages/login/index` | auth is intentionally modeled as a redirect- and provider-aware login state machine, not a generic draftable form |
| Commerce confirmation actions | explicit action-workflow exception | membership entry points on all official hosts | purchase, cancel, refund, and renew are action confirmations over selected commerce detail, not schema-driven shared forms |
