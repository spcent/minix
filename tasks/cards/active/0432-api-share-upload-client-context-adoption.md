# Card 0432 API Share Upload Client Context Adoption

## Summary

Adopt the shared API client-context helper in share and upload routes.

## Goal

Make rate-limit and audit context assembly consistent across API domains by replacing remaining hand-built `clientId` and optional `deviceId` blocks in share and upload routes.

## Milestone

- milestone file: none
- slice name: `api share upload client context adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - use `loadRouteClientContext` in share prepare route
  - use `loadRouteClientContext` in upload session route
  - focused API/typecheck verification
- Out of scope:
  - changing client ID resolution policy
  - changing device ID parsing
  - changing rate-limit/audit behavior

## Ownership

- owned files:
  - `apps/api/src/domains/share/routes.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - `tasks/cards/active/0432-api-share-upload-client-context-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes
  - generated files

## Dependencies

- depends on:
  - `tasks/cards/active/0408-api-route-client-context-helper.md`
  - `tasks/cards/active/0430-api-route-option-shared-types.md`
- blocked by:
  - none
- integration notes:
  - Preserve omission of `deviceId` when the resolver returns an empty or missing value.

## Affected Paths

- `apps/api/src/domains/share/routes.ts`
- `apps/api/src/domains/uploads/routes.ts`

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
  - rate-limit and audit calls still receive the same `clientId` and optional `deviceId`.

## Implementation Notes

- Replaced hand-built share prepare `clientId`/`deviceId` blocks with `loadRouteClientContext`.
- Replaced hand-built upload session `clientId`/`deviceId` blocks with `loadRouteClientContext`.
- Preserved spreading the same context into rate-limit and audit calls.

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
