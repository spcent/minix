# Card 0074 Payment Order Foundation

## Summary

Build a real payment/order domain instead of treating membership purchase as a stand-in for the entire payment surface.

## Goal

Introduce shared contracts and feature-owned flows for `order`, `paymentIntent`, `paymentResult`, and entitlement reconciliation while keeping platform-specific payment calls in adapter layers.

## Milestone

- milestone file: none
- slice name: `payment and order foundation`

## Scope

- In scope:
  - add contracts for `order`, `paymentIntent`, `paymentResult`, and entitlement outputs
  - model order lifecycle states for created, pending payment, paid, closed, cancelled, and refunded orders
  - cover product shapes such as one-time goods, subscription goods, membership packages, and value-added services
  - cover channel and execution semantics for WeChat pay, H5 pay, membership purchase, and virtual-right purchase
  - cover payment result states for success, failure, cancel, and later reconciliation query
  - model idempotency, duplicate-payment protection, callback verification placeholders, and order-status polling semantics
  - refactor membership purchase flow to sit on top of the new payment domain where possible
  - reserve platform-specific payment execution points without calling `wx.*` or browser globals from shared features
- Out of scope:
  - real gateway signing, callback verification, or production billing integration
  - invoice, tax, or settlement systems

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/contracts/src/kernel/capability.ts`
  - `packages/features/subscription/src/**`
  - new `packages/features/*` payment-related package if needed
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests and page definitions
  - affected tests
- allowed generated outputs:
  - generated host manifests and shells when new pages are added
- forbidden files:
  - direct shared-code calls to platform payment APIs

## Dependencies

- depends on:
  - `0069-auth-identity-contract-hardening.md`
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - preserve the current membership sample flow while migrating it toward an order-based contract

## Affected Paths

- `packages/contracts/src/api/membership.ts`
- `packages/contracts/src/kernel/capability.ts`
- `packages/features/subscription/src/model/index.ts`
- `packages/features/subscription/src/controller/index.ts`
- optional new payment feature package under `packages/features/*`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, add order and payment contracts
- store shape changes allowed:
  - yes, in payment or subscription feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for payment source and return-target context

## Verification

- slice gate:
  - membership purchase flow can be expressed through an order/payment-intent/result contract without breaking current sample behavior
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - document which payment states are modeled and which gateway operations remain reserved
  - document how the current membership sample flow maps onto order and payment-intent abstractions

## Acceptance

- [ ] payment has first-class order and intent contracts
- [ ] subscription flow no longer represents the entire payment domain by itself
- [ ] platform payment capability is reserved behind adapters, not called from shared features
- [ ] contracts and sample routes cover order state, result state, idempotency, and reconciliation semantics explicitly
- [ ] `pnpm verify` run
