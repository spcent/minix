# Card 0100 Payment Real Gateway And Ledger Completion

## Summary

Move payment from sample order flow to a real gateway-integrated transaction system.

## Goal

Implement production-grade payment initiation, callback verification, cancel/refund synchronization, ledger records, reconciliation, and gateway-safe idempotency.

## Milestone

- milestone file: none
- slice name: `payment real gateway and ledger completion`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add gateway request/response contracts for WeChat Pay and H5 payment execution
  - implement cryptographic callback signature verification and replay protection
  - persist payment ledger, operation ledger, idempotency keys, gateway references, and reconciliation results
  - implement cancel and refund as gateway-backed operations with asynchronous state tracking
  - add order list/detail, payment result polling, and failure recovery tests
- Out of scope:
  - broader SKU catalog expansion, covered by `0115`

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/subscription/src/**`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - payment tests
- allowed generated outputs:
  - none unless host payment pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0084-payment-transaction-operations-hardening.md`
- blocked by:
  - selected payment provider credentials and webhook signing configuration
- integration notes:
  - sample payment mode must be explicitly separated from production provider mode

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/features/subscription/src/controller/index.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `apps/api/src/app.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, signature verification, ledger entries, and async operation states
- store shape changes allowed:
  - yes, for durable order/payment/refund/callback/reconciliation ledgers
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for order and payment result routes

## Verification

- slice gate:
  - callback verification rejects unsigned, replayed, stale, or mismatched callbacks
- generation needed:
  - none unless new payment pages are added
- final verifier handoff:
  - include provider-mode and sample-mode test results separately

## Acceptance

- [ ] gateway-backed payment initiation returns host-executable payment parameters
- [ ] callback verification uses real signature/replay checks
- [ ] cancel and refund synchronize with gateway operation state
- [ ] payment, refund, callback, and reconciliation ledgers are persisted
- [ ] idempotency survives repeated requests and process restarts
- [ ] `pnpm verify` run
