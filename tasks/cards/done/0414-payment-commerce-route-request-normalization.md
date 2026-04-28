# Card 0414 Payment Commerce Route Request Normalization

## Summary

Normalize payment commerce route request assembly.

## Goal

Reduce repeated optional-field object assembly in payment commerce routes so membership purchase, SKU purchase, order listing, and subscription renewal request shaping stay consistent for reuse across product matrices.

## Milestone

- milestone file: none
- slice name: `payment commerce route request normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - payment commerce purchase request assembly
  - order list request assembly
  - subscription renewal request assembly
  - payment route client context reuse for rate-limit and audit payloads
  - API verification and typecheck
- Out of scope:
  - changing payment statuses or ledgers
  - changing idempotency behavior
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/payment/routes.commerce.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0406-api-defined-field-helper`
  - `0408-api-route-client-context-helper`
- blocked by:
  - none
- integration notes:
  - Preserve current omission semantics and payment audit payload fields.

## Affected Paths

- `apps/api/src/domains/payment/routes.commerce.ts`

## Related Specs

- `docs/modules/api.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - purchase, list, and renewal responses keep existing behavior.

## Implementation Notes

- Adopted `pickDefinedApiFields` for membership purchase, SKU purchase, order list, and subscription renewal request assembly.
- Reused `loadRouteClientContext` for membership purchase rate-limit and audit payloads.
- Kept payment response shaping and ledger behavior unchanged.

## Verification Notes

- Ran `pnpm verify:api`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
