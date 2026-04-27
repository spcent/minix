# Card 0410 Content Route Request Normalization

## Summary

Normalize content route request assembly.

## Goal

Replace repeated optional-field spreads in content review, draft, lifecycle, and reading progress routes with shared request shaping helpers so API behavior stays clear and reusable.

## Milestone

- milestone file: none
- slice name: `content route request normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - content route request object assembly
  - defined-field API helper adoption
  - API verification and typecheck
- Out of scope:
  - changing managed content workflows
  - changing reading progress persistence semantics
  - contract changes

## Ownership

- owned files:
  - `apps/api/src/domains/content/routes.ts`
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
  - Keep truthy-only behavior where current code intentionally excludes empty strings and keep undefined-only behavior where numeric optional fields are valid at zero.

## Affected Paths

- `apps/api/src/domains/content/routes.ts`

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
  - review queue, draft save, lifecycle, and reading progress payloads preserve existing behavior.

## Implementation Notes

- Adopted `pickDefinedApiFields` for content detail, review queue, draft save, lifecycle, and reading progress request assembly.
- Kept required draft and lifecycle fields explicit while optional fields use shared defined-field omission.
- Preserved numeric optional reading-progress fields, including zero-valued `scrollOffset` and `pageIndex`.

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
