# Card 0430 API Route Option Shared Types

## Summary

Centralize repeated API domain route option and rate-limit guard types.

## Goal

Make API route registration contracts clearer and less repetitive so new product-matrix domains can reuse the same base route option shapes instead of re-declaring Hono, session, store, client context, and rate-limit result fields.

## Milestone

- milestone file: none
- slice name: `api route option shared types`

## Priority

- priority: `P3`

## Scope

- In scope:
  - add shared API domain route-option types under `apps/api/src/domains`
  - adopt shared base/client-context/rate-limit result types in selected route option interfaces
  - focused API/typecheck verification
- Out of scope:
  - route behavior changes
  - response envelope changes
  - moving app composition logic out of existing files

## Ownership

- owned files:
  - `apps/api/src/domains/route-options.ts`
  - selected `apps/api/src/domains/*/routes*.ts`
  - selected `apps/api/src/domains/*/route-options.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/api/src/app.ts` unless wiring fails
  - generated files

## Dependencies

- depends on:
  - `tasks/cards/active/0408-api-route-client-context-helper.md`
- blocked by:
  - none
- integration notes:
  - Keep the shared type file backend-local; do not expose API route registration implementation details through `packages/contracts`.

## Affected Paths

- `apps/api/src/domains/route-options.ts`
- `apps/api/src/domains/*/routes*.ts`
- `apps/api/src/domains/*/route-options.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/modules/api.md`
- `specs/dependency-rules.yaml`

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
  - route behavior must remain unchanged; this is a type and clarity consolidation only.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
