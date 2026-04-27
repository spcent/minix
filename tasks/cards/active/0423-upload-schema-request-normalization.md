# Card 0423 Upload Schema Request Normalization

## Summary

Normalize upload schema request assembly.

## Goal

Use the API defined-field helper in upload schema normalizers so selection and attach requests share the same optional-field convention as other API routes.

## Milestone

- milestone file: none
- slice name: `upload schema request normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - upload selection result normalization
  - upload attach request normalization
  - API verification and typecheck
- Out of scope:
  - changing upload pipeline semantics
  - changing upload asset cloning
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/schemas.ts`
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
  - Keep source and actor context normalization explicit inside the reference object.

## Affected Paths

- `apps/api/src/domains/uploads/schemas.ts`

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
  - Upload endpoint tests should keep selection, attach, retry, cancel, and complete behavior unchanged.

## Implementation Notes

- Pending.

## Verification Notes

- Pending.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
