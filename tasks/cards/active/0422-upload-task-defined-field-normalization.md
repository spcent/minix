# Card 0422 Upload Task Defined Field Normalization

## Summary

Normalize upload task optional field cloning.

## Goal

Use the shared domain snapshot helper in upload task cloning so governance, lifecycle, and task optional fields keep one reusable omission and clone policy.

## Milestone

- milestone file: none
- slice name: `upload task defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - upload governance optional fields
  - upload lifecycle optional fields
  - upload task optional scalar fields
  - API verification and typecheck
- Out of scope:
  - changing upload pipeline behavior
  - changing transfer payload cloning
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/tasks.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0419-domain-defined-snapshot-helper`
- blocked by:
  - none
- integration notes:
  - Keep `integrity` on the dedicated clone helper because it maps an input shape to the contract shape.

## Affected Paths

- `apps/api/src/domains/uploads/tasks.ts`

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
  - Upload task helper tests in the API suite should keep passing.

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
