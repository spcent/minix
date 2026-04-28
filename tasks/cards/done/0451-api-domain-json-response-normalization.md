# Card 0451 API Domain JSON Response Normalization

## Summary

Normalize remaining API domain JSON response construction.

## Goal

Remove direct `Response.json` usage from API domain handlers so error responses and normal JSON responses follow existing route helpers.

## Milestone

- milestone file: none
- slice name: `api domain json response normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - replace account security helper direct error `Response.json` calls with `jsonError`
  - replace payment catalog direct `Response.json` with route `c.json`
  - focused API/typecheck verification
- Out of scope:
  - response envelope changes
  - status code changes
  - payment catalog behavior changes

## Ownership

- owned files:
  - `apps/api/src/domains/account/route-helpers.ts`
  - `apps/api/src/domains/payment/routes.commerce.ts`
  - `tasks/cards/active/0451-api-domain-json-response-normalization.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0435-api-trace-helper-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep account security failure codes and payment catalog payload unchanged.

## Affected Paths

- `apps/api/src/domains/account/route-helpers.ts`
- `apps/api/src/domains/payment/routes.commerce.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
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
  - `pnpm typecheck`
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - Account security failures should keep the same status and code.
  - `/orders/catalog` should keep the same response payload.

## Implementation Notes

- Replaced account security helper direct `Response.json` error paths with `jsonError`.
- Replaced payment catalog direct `Response.json` with route-level `c.json`.
- Confirmed direct `Response.json` usage is now contained in the HTTP response helper.

## Verification Notes

- Ran `pnpm typecheck`.
- Ran `pnpm verify:api`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
