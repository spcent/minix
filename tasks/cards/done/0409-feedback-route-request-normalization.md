# Card 0409 Feedback Route Request Normalization

## Summary

Normalize feedback route request assembly.

## Goal

Remove repeated optional-field object spread blocks from feedback API routes so ticket list, revisit, rate-limit, and audit request shaping stay consistent and easier to reuse across product matrices.

## Milestone

- milestone file: none
- slice name: `feedback route request normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - feedback route request object assembly
  - defined-field API helper adoption
  - route client context helper adoption where feedback still resolves client/device inline
  - API verification and typecheck
- Out of scope:
  - changing feedback ticket behavior
  - changing rate-limit or audit semantics
  - contract changes

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/routes.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0406-api-defined-field-helper`
  - `0408-api-route-client-context-helper`
- blocked by:
  - none
- integration notes:
  - Preserve the current omission of undefined optional fields and empty device IDs.

## Affected Paths

- `apps/api/src/domains/feedback/routes.ts`

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
  - feedback list, revisit, submit rate-limit, and submit audit payloads preserve existing fields.

## Implementation Notes

- Adopted `pickDefinedApiFields` for feedback ticket list and revisit request assembly.
- Reused `loadRouteClientContext` for feedback submit rate-limit and audit payloads.
- Preserved the previous undefined-field omission behavior and empty device ID omission behavior.

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
