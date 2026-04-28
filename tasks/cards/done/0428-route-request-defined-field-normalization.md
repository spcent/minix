# Card 0428 Route Request Defined Field Normalization

## Summary

Normalize small route request optional fields.

## Goal

Use the API defined-field helper in focused route request assembly sites that still hand-roll optional request fields.

## Milestone

- milestone file: none
- slice name: `route request defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - share return recognition optional fields
  - upload cancel optional reason field
  - API verification and typecheck
- Out of scope:
  - changing share attribution behavior
  - changing upload pipeline behavior
  - broad route rewrites

## Ownership

- owned files:
  - `apps/api/src/domains/share/routes.ts`
  - `apps/api/src/domains/uploads/routes.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0406-api-defined-field-helper`
- blocked by:
  - none
- integration notes:
  - Keep response persistence blocks explicit because they reconcile domain outputs with existing stored records.

## Affected Paths

- `apps/api/src/domains/share/routes.ts`
- `apps/api/src/domains/uploads/routes.ts`

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
  - Share and upload API tests should keep return recognition and cancel flows unchanged.

## Implementation Notes

- Imported `pickDefinedApiFields` into share and upload route modules.
- Replaced hand-rolled optional request fields for share return recognition and upload cancel requests.
- Kept response persistence and pipeline result reconciliation explicit.

## Verification Notes

- `pnpm verify:api` passed.
- `pnpm typecheck` passed.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
