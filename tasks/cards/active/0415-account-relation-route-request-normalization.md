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

- Adopted `pickDefinedApiFields` for relation list, asset history, relation target fallback lookup, relation action, and mutation refresh request assembly.
- Kept required relation kind and default fallback pagination explicit.
- Preserved relation mutation behavior and response shape.

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
