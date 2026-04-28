# Card 0419 Domain Defined Snapshot Helper

## Summary

Add a domain snapshot helper for defined optional fields.

## Goal

Centralize the repeated “copy this optional field only when it is defined” pattern for domain snapshots so API domain normalizers can stay concise while still cloning snapshot values.

## Milestone

- milestone file: none
- slice name: `domain defined snapshot helper`

## Priority

- priority: `P3`

## Scope

- In scope:
  - helper in `apps/api/src/domains/snapshot.ts`
  - unit coverage for defined, falsy, undefined, and cloned values
  - API verification and typecheck
- Out of scope:
  - changing stored state shapes
  - changing route contracts
  - replacing every optional spread in one pass

## Ownership

- owned files:
  - `apps/api/src/domains/snapshot.ts`
  - `apps/api/src/domains/snapshot.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Helper must preserve falsy defined values and deep clone selected fields.

## Affected Paths

- `apps/api/src/domains/snapshot.ts`
- `apps/api/src/domains/snapshot.test.ts`

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
  - Optional field cloning should omit only `undefined`, not falsy values.

## Implementation Notes

- Added `cloneDefinedDomainFields` to domain snapshot helpers.
- The helper omits only `undefined` fields, preserves falsy defined values, and deep clones selected values.
- Added unit coverage for falsy values, undefined omission, and deep cloning.

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
