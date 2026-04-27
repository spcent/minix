# Card 0426 Feedback Schema Defined Field Normalization

## Summary

Normalize feedback schema request assembly.

## Goal

Use the API defined-field helper in feedback schema normalizers so submit and ticket action requests share the same optional-field convention as other API routes.

## Milestone

- milestone file: none
- slice name: `feedback schema defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - submit feedback optional request fields
  - feedback context optional source and device fields
  - ticket action optional request fields
  - nested assignee and SLA optional fields
  - API verification and typecheck
- Out of scope:
  - changing feedback workflow behavior
  - changing feedback contracts
  - changing upload asset normalization

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/schemas.ts`
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
  - Keep source and actor context snapshot normalization explicit inside the feedback context object.

## Affected Paths

- `apps/api/src/domains/feedback/schemas.ts`

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
  - Feedback API tests should keep submit, rate limit, and ticket action flows unchanged.

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
