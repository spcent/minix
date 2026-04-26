# Card 0406 API Defined Field Helper

## Summary

Add an API-domain helper for copying only defined request fields.

## Goal

Reduce repeated optional request-object assembly in API domains and keep query/body normalization consistent without importing core runtime helpers into backend-only code.

## Milestone

- milestone file: none
- slice name: `api defined field helper`

## Priority

- priority: `P3`

## Scope

- In scope:
  - add `pickDefinedApiFields` to API schema helpers
  - cover falsy-but-defined preservation
  - adopt it in message request normalization and routes
- Out of scope:
  - changing API envelopes
  - changing schema validation
  - broad route rewrites

## Ownership

- owned files:
  - `apps/api/src/domains/schema-helpers.ts`
  - `apps/api/src/domains/schema-helpers.test.ts`
  - selected `apps/api/src/domains/messages/*`
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
  - Keep helper in API domain helpers because backend routes should not depend on core manifest helpers.

## Affected Paths

- `apps/api/src/domains/schema-helpers.ts`
- `apps/api/src/domains/schema-helpers.test.ts`
- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/messages/schemas.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`

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
  - API schema helper tests
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - optional request fields preserve explicit `false`, `0`, and empty strings when schema allows them.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
