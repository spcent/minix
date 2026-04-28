# Card 0408 API Route Client Context Helper

## Summary

Centralize API route client and device context extraction.

## Goal

Remove repeated `resolveClientId` and `resolveRequestDeviceId` blocks from API route handlers so rate-limit/audit contexts stay consistent as account, message, feedback, upload, and share workflows are reused in other product matrices.

## Milestone

- milestone file: none
- slice name: `api route client context helper`

## Priority

- priority: `P3`

## Scope

- In scope:
  - helper in `apps/api/src/http/route-context.ts`
  - adoption in message routes and account route helpers
  - API verification and typecheck
- Out of scope:
  - changing client ID resolution policy
  - changing device ID parsing
  - changing rate-limit or audit behavior

## Ownership

- owned files:
  - `apps/api/src/http/route-context.ts`
  - `apps/api/src/domains/messages/routes.ts`
  - `apps/api/src/domains/account/route-helpers.ts`
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
  - Helper only reads existing route inputs and preserves the current optional `deviceId` omission behavior.

## Affected Paths

- `apps/api/src/http/route-context.ts`
- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/account/route-helpers.ts`

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

- Added `loadRouteClientContext` to API HTTP route context helpers.
- Adopted the helper in account route helpers and message thread create/send routes.
- Preserved the previous behavior of omitting `deviceId` when the resolver returns an empty or missing value.

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
