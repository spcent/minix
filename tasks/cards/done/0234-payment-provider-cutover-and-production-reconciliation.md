# Card 0234 Payment Provider Cutover And Production Reconciliation

## Summary

Close the remaining payment launch gap by cutting over from sample-backed gateway posture to a production provider configuration and reconciliation runbook.

## Goal

Make payment, callback verification, refund, cancel, and reconciliation production-ready for the official hosts.

## Milestone

- milestone file: none
- slice name: `payment provider cutover and production reconciliation`

## Priority

- priority: `P0`

## Scope

- In scope:
  - wire selected payment provider configuration into the production path
  - validate production callback signing, replay protection, and idempotency under real gateway semantics
  - verify H5 and WeChat payment parameter execution against provider-backed responses
  - document merchant setup, webhook routing, and reconciliation procedure
- Out of scope:
  - expanding the generic commerce model beyond current SKU and membership scope

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/subscription/src/**`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `apps/api/src/domains/payment/**`
  - `docs/**`
- allowed generated outputs:
  - none unless host commerce manifests change
- forbidden files:
  - committed merchant secrets or webhook credentials

## Dependencies

- depends on:
  - `tasks/cards/done/0228-generic-order-center-surface.md`
  - `tasks/cards/done/0100-payment-real-gateway-and-ledger-completion.md`
- blocked by:
  - merchant account, webhook secret, and production callback routing
- integration notes:
  - keep generic hosts on dedicated order-center routes and novel hosts on the membership-centered flow

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/features/subscription/src/controller/index.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `apps/api/src/domains/payment/routes.callbacks.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, payment execution params, and reconciliation metadata
- store shape changes allowed:
  - yes, in payment ledger and reconciliation state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new host route is expected

## Verification

- slice gate:
  - production payment path no longer depends on sample-only provider posture
- generation needed:
  - none unless host commerce surfaces change
- final verifier handoff:
  - include payment provider mode matrix, webhook validation, and refund/cancel reconciliation evidence

## Acceptance

- [x] production payment provider configuration is wired and documented
- [x] H5 and WeChat payment execution paths validate provider-backed parameters
- [x] callback signing, replay protection, and reconciliation are verified for production mode
- [x] order-center and membership surfaces show production-safe payment posture
- [x] `pnpm verify` run if code changes
