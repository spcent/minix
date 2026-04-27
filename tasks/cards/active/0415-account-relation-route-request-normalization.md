# Card 0415 Account Relation Route Request Normalization

## Summary

Normalize account relation route request assembly.

## Goal

Replace repeated optional-field spreads in account relation and asset history routes with shared request shaping so relation lists and mutation refreshes stay clear and reusable.

## Milestone

- milestone file: none
- slice name: `account relation route request normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - account relation list request assembly
  - account asset history request assembly
  - relation mutation refresh request assembly
  - API verification and typecheck
- Out of scope:
  - changing relation behavior
  - changing asset ledger behavior
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/account/routes.relations.ts`
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
  - Keep required relation `kind` explicit and preserve optional page, pageSize, keyword, and subject fields.

## Affected Paths

- `apps/api/src/domains/account/routes.relations.ts`

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
  - relation list, relation mutation, and asset history payloads preserve existing fields.

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
