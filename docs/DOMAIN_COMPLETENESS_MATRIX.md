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
| 1 | Login | `partial`, `sample-provider` | `packages/contracts/src/api/auth.ts`, `packages/features/auth/src/controller/index.ts`, `apps/api/src/domains/auth/routes.ts`, `packages/core/src/runtime/auth.ts` | `apps/host-h5:/` with explicit guest entry posture, `apps/host-wechat:/pages/login/index` with explicit `wx.login` posture, `apps/novel-h5:/login`, `apps/novel-wechat:/pages/login/index`, plus identity pages on `host-h5` and `host-wechat` | no dedicated auth recovery callback or auth center surface on official hosts; SMS and OAuth providers remain operator-owned sample-to-production rollout items | `0211-login-host-and-provider-closure.md` |
| 2 | User | `partial`, `host-missing` | `packages/contracts/src/api/user.ts`, `packages/features/account/src/controller/index.ts`, `apps/api/src/domains/account/routes.ts`, `apps/api/src/domains/account/routes.identity.ts`, `apps/api/src/domains/account/routes.relations.ts` | `apps/host-h5:/account`, `apps/host-wechat:/pages/account/index` | `novel-h5` and `novel-wechat` do not expose account center; no dedicated user detail entry outside search/account flow | `0212-user-host-surface-closure.md` |
| 3 | Settings | `partial` | `packages/contracts/src/api/settings.ts`, `packages/features/settings/src/controller/index.ts`, `apps/api/src/domains/settings/routes.ts`, `apps/api/src/domains/settings/state.ts` | `apps/host-h5:/preferences`, `apps/host-wechat:/pages/settings/index`, `apps/novel-h5:/preferences`, `apps/novel-wechat:/pages/settings/index` | settings exists on all hosts, but bounded account/device/privacy operations are still uneven by host | `0213-settings-surface-parity.md` |
| 4 | Messages | `partial`, `host-missing`, `sample-provider` | `packages/contracts/src/api/message.ts`, `packages/features/messages/src/controller/index.ts`, `apps/api/src/domains/messages/routes.ts`, `apps/api/src/domains/messages/touchpoints.ts` | `apps/host-h5:/inbox`, `apps/host-wechat:/pages/messages/index` | `novel-h5` and `novel-wechat` message center missing; no real-time channel beyond polling | `0214-messages-host-adoption-and-sync-hardening.md` |
| 5 | Payment | `partial`, `sample-provider` | `packages/contracts/src/api/payment.ts`, `packages/features/subscription/src/controller/index.ts`, `apps/api/src/domains/payment/routes.ts`, `apps/api/src/domains/payment/routes.commerce.ts`, `apps/api/src/domains/payment/routes.callbacks.ts`, `apps/api/src/domains/payment/routes.after-sales.ts` | `apps/host-h5:/membership`, `apps/host-wechat:/pages/membership/index`, `apps/novel-h5:/membership`, `apps/novel-wechat:/pages/membership/index` | no separate generic order-center page outside the shared membership/commerce center; sample and production provider posture still needs further hardening | `0215-payment-host-entry-and-provider-closure.md` |
| 6 | Content | `partial`, `host-missing` | `packages/contracts/src/api/content.ts`, `packages/features/feed/src/controller/index.ts`, `packages/features/catalog/src/controller/index.ts`, `packages/features/novel-detail/src/controller/index.ts`, `apps/api/src/domains/content/routes.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index` for managed content/search, `apps/novel-h5:/`, `/books`, `/novel/detail`, `/reader`, `apps/novel-wechat:/pages/catalog/index`, `/pages/novelDetail/index`, `/pages/reader/index` | no explicit CMS-style host page on official hosts beyond discover flow; novel hosts still do not expose the shared cross-domain content/search surface | `0216-content-surface-and-cms-entry-closure.md` |
| 7 | Search | `partial`, `host-missing` | `packages/contracts/src/api/search.ts`, `packages/features/feed/src/controller/index.ts`, `apps/api/src/domains/content/feed.ts`, `apps/api/src/domains/content/search.ts` | `apps/host-h5:/discover`, `apps/host-wechat:/pages/feed/index` | `novel-h5` and `novel-wechat` do not expose shared cross-domain search center | `0217-search-center-host-adoption.md` |
| 8 | List | `implemented` | `packages/core/src/page-protocols/list.ts`, adopting controllers in `packages/features/items`, `messages`, `feed`, `subscription`, `account` | list surfaces already appear across `host-h5`, `host-wechat`, `novel-h5`, `novel-wechat` | no domain-specific missing route is blocking; what remains is adoption consistency and business-state parity audit | `0218-list-protocol-adoption-audit.md` |
| 9 | Detail | `implemented` | `packages/core/src/page-protocols/detail.ts`, adopting controllers in `packages/features/messages`, `subscription`, `novel-detail`, `reader` | dedicated detail pages exist mainly in novel apps; embedded detail surfaces exist in `host-h5` account/messages/subscription-style flows | official host detail surfaces are still uneven; some domains rely on inline detail instead of explicit routeable entry points | `0219-detail-protocol-adoption-audit.md` |
| 10 | Form | `implemented` | `packages/core/src/page-protocols/form.ts`, adopting controllers in `packages/features/auth`, `account`, `feedback`, `feed` | `apps/host-h5:/`, `/feedback`, `/account`, `/discover`; `apps/host-wechat:/pages/login/index`, `/pages/identityUpgrade/index`, `/pages/identityBindPhone/index`, `/pages/identityMerge/index`; `novel` login and membership flows | no shared form work is missing at the kernel layer; remaining work is host adoption consistency and form entry discoverability | `0220-form-protocol-adoption-audit.md` |
| 11 | Upload | `partial`, `host-missing`, `sample-provider` | `packages/contracts/src/api/upload.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/uploads/routes.ts`, `apps/api/src/domains/uploads/pipeline.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index`, indirect attachment use in `apps/host-h5:/feedback` and `/discover` | `novel-h5` and `novel-wechat` do not expose upload workspace; review/storage provider is still sample-backed | `0221-upload-host-and-provider-closure.md` |
| 12 | Share | `partial`, `host-missing`, `sample-provider` | `packages/contracts/src/api/share.ts`, `packages/features/media-tools/src/controller/index.ts`, `apps/api/src/domains/share/routes.ts`, `apps/api/src/domains/share/attribution.ts` | `apps/host-h5:/media-tools`, `apps/host-wechat:/pages/mediaTools/index` | `novel-h5` and `novel-wechat` do not expose shared attribution/report entry; poster and short-link generation remain sample-style | `0222-share-host-and-provider-closure.md` |
| 13 | Feedback | `partial`, `host-missing` | `packages/contracts/src/api/feedback.ts`, `packages/features/feedback/src/controller/index.ts`, `apps/api/src/domains/feedback/routes.ts`, `apps/api/src/domains/feedback/support.ts` | `apps/host-h5:/feedback`, `apps/host-wechat:/pages/feedback/index` | `novel-h5` and `novel-wechat` feedback/support entry missing | `0223-feedback-host-support-surface-closure.md` |

## Suggested Execution Order

1. `0211` login
2. `0212` user
3. `0213` settings
4. `0214` messages
5. `0221` upload
6. `0222` share
7. `0223` feedback
8. `0217` search
9. `0216` content
10. `0215` payment
11. `0218` list
12. `0219` detail
13. `0220` form

## Notes

- `apps/host-h5` already exposes the broadest business surface: `account`, `discover`, `feedback`, `inbox`, and `media-tools`.
- `apps/host-wechat` now exposes the shared official-host surface for `account`, `feed`, `feedback`, `messages`, and `media-tools` in addition to `login`, identity pages, `overview`, `items`, and `settings`.
- `apps/novel-h5` and `apps/novel-wechat` currently carry the strongest payment and content-consumption surfaces through `membership`, `catalog`, `novelDetail`, `toc`, `reader`, and `bookshelf`.
