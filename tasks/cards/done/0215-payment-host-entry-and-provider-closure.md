# Card 0215 Payment Host Entry And Provider Closure

## Summary

Turn the current payment domain from novel-surface-heavy coverage into an official-host-visible commerce surface with explicit provider posture.

## Goal

Expose shared order and payment entry points beyond the novel membership pages and make sample versus production payment modes operationally clear.

## Milestone

- milestone file: none
- slice name: `payment host entry and provider closure`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define which official hosts should expose order list, order detail, and payment recovery entry points
  - add minimal manifest-driven host routes where the domain is currently only reachable through novel membership
  - clarify provider-mode behavior and remove any ambiguous sample-first host UX
  - verify reconciliation, refund, and after-sales entry affordances from the chosen hosts
- Out of scope:
  - expanding into invoice, settlement, or tax systems

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/subscription/src/**`
  - `apps/api/src/domains/payment/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - direct shared-code calls to platform payment APIs

## Dependencies

- depends on:
  - `0216-content-surface-and-cms-entry-closure.md`
- blocked by:
  - final decision on which official hosts should expose generic order-center entry points
- integration notes:
  - keep membership purchase as one payment-domain consumer, not the only host-visible commerce surface

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/api/src/domains/payment/routes.ts`
- `apps/api/src/domains/payment/routes.commerce.ts`
- `apps/api/src/domains/payment/routes.callbacks.ts`
- `apps/api/src/domains/payment/routes.after-sales.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for order-center entry metadata and provider-state wording
- store shape changes allowed:
  - yes, in subscription/payment state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for order and after-sales selection

## Verification

- slice gate:
  - payment/order flows are reachable from agreed official hosts and provider mode is explicit in the UX and docs
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record official-host payment entry matrix and provider-mode matrix

## Acceptance

- [x] order/payment entry points are not novel-only by accident
- [x] provider-mode behavior is explicit and non-ambiguous
- [x] after-sales and reconciliation routes remain reachable from selected host surfaces
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added official-host `membership` commerce routes to `apps/host-h5` and `apps/host-wechat`, reusing the shared `subscription` feature instead of creating a host-local payment page
- 2026-04-12: extended shared settings navigation and the shared subscription feature entry actions so purchase, reconciliation, refund, cancellation, renewal, and after-sales detail remain feature-driven
- 2026-04-12: updated production-readiness and completeness docs so sample-versus-production payment posture is explicit on the official host commerce surfaces
