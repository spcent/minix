# Card 0425 Upload Record Defined Field Normalization

## Summary

Normalize upload record optional snapshot fields.

## Goal

Use shared domain snapshot helpers in upload record cloning so review, cleanup, reference, and stored-record optional fields share the same omission and clone behavior.

## Milestone

- milestone file: none
- slice name: `upload record defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - upload review record optional fields
  - upload cleanup record optional fields
  - upload reference optional context and summary fields
  - stored upload record optional binary object key
  - API verification and typecheck
- Out of scope:
  - changing upload pipeline semantics
  - changing chunk or transfer cloning
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/records.ts`
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
  - Keep optional artifacts that require dedicated clone helpers on their explicit mapping path.

## Affected Paths

- `apps/api/src/domains/uploads/records.ts`

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
  - Upload record helper tests should keep proving nested records and optional context snapshots are cloned.

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
