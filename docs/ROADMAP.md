# Roadmap

This roadmap describes the current `v1.0.0` repository posture. It is intentionally bounded: MiniX is maintaining the official H5, WeChat, novel, and API samples, not expanding into a general cross-platform framework by default.

Use it together with:

- [`../README.md`](../README.md)
- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md)
- [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)

## Current Posture

The official sample surface is:

- `apps/api`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The repo-side kernel work is already in place for:

- canonical domain output envelopes
- shared page protocols for list, detail, and form-like flows
- shared account, settings, discover, content, media-tools, messages, payment, feedback, and auth controller posture
- manifest-driven host wiring across all official hosts
- provider-readiness diagnostics and remote evidence capture
- boundary checks for contracts, package entries, platform calls, result discipline, host routes, and host wiring

The remaining release risk is mostly operator execution: provider rollout, remote environment configuration, WeChat validation, and tracked signoff evidence.

## Priority 0: Release Closure

These are the active release-facing tracks:

- [`0241` auth provider rollout](../tasks/cards/active/0241-auth-provider-operator-rollout.md)
- [`0242` message provider rollout and polling acceptance](../tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md)
- [`0243` payment merchant rollout and callback ops](../tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md)
- [`0244` upload provider rollout and asset-host cutover](../tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md)
- [`0245` share provider rollout and attribution ops](../tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md)
- [`0246` release execution and signoff](../tasks/cards/active/0246-release-execution-and-signoff.md)

Coordination card [`0247`](../tasks/cards/done/0247-release-follow-up-queue-coordination.md) is already closed and defines the queue shape. Keep `0246` open until provider evidence, remote verification, manual WeChat validation, and final go/no-go ownership are recorded in [`VERIFICATION_LOG.md`](./VERIFICATION_LOG.md).

## Priority 1: Safe Hardening

After release closure, safe work should stay inside the current contracts and hosts:

1. Strengthen real provider adapters and environment validation without changing canonical envelopes.
2. Reduce manual evidence drift with better preview/production comparison and copy-ready verification output.
3. Tighten contract-governance checks around canonical outputs and protocol exceptions.
4. Improve degraded-mode UX by extending shared capability summaries, not host-local fallback copy.
5. Keep API domain files thin by moving shaping and workflow logic into domain helpers.

Recent hardening cards `0253` through `0270` are implemented and should be treated as the current baseline, not as a future backlog.

## Priority 2: Bounded Product Growth

Product expansion is acceptable only when it extends existing surfaces additively:

- content and discover growth should extend `contentCard`, `contentDetail`, `contentAccess`, and `searchResults`
- account and relationship growth should extend the shared account workspace before adding a separate user-detail stack
- upload and share growth should extend the normalized media-tools envelopes and capability summaries
- messages and feedback growth should keep the shared support-loop vocabulary aligned
- payment growth should extend order, intent, result, entitlement, callback, and ledger diagnostics without host-local wrappers

Add new contracts only when the shared surface genuinely changes. Prefer feature/controller work before host-specific patches.

## Scope Decisions Required

The following are not automatic next steps:

- new platform families such as Douyin, Alipay, or native shells
- dedicated CMS, moderation, customer-service, or operations consoles
- broad view-layer unification or a UI component framework
- new top-level catch-all packages
- host-only fallback systems for behavior that belongs in shared state

Start any of those only with a written scope decision and updated architecture, contract, and release docs.

## Execution Rules

1. Close the active release queue before broadening product scope.
2. Keep provider rollout explicit; do not hide production gaps behind sample defaults.
3. Prefer additive contract and controller changes over new sibling wrappers.
4. Update `BACKEND_CONTRACT`, `DOMAIN_COMPLETENESS_MATRIX`, and `PRODUCTION_READINESS` when behavior or release posture changes.
5. Run `pnpm verify` for code changes and record docs-only skips explicitly.
