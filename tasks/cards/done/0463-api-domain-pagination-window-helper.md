# Card 0463 API Domain Pagination Window Helper

## Summary

Consolidate repeated API domain pagination window calculations behind one internal helper.

## Goal

Make list-style API domains easier to reuse across future product hosts by using one clear page, pageSize, slice, and hasMore calculation pattern.

## Milestone

- milestone file: none
- slice name: `api domain pagination window helper`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add a small API domain helper for page defaults, optional max page size clamping, sliced items, total, and hasMore
  - adopt the helper in existing API domain list functions that already compute the same pagination window locally
  - add focused tests for defaulting, clamping, and hasMore behavior
- Out of scope:
  - request/response contract changes
  - route id changes
  - feature controller pagination rewrites

## Ownership

- owned files:
  - `apps/api/src/domains/pagination.ts`
  - `apps/api/src/domains/pagination.test.ts`
  - selected files under `apps/api/src/domains/*`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests, registries, or WeChat shell outputs

## Dependencies

- depends on:
  - existing domain response shapes
- blocked by:
  - none
- integration notes:
  - keep response fields stable; only replace duplicated calculation blocks

## Affected Paths

- `apps/api/src/domains/pagination.ts`
- `apps/api/src/domains/content/*`
- `apps/api/src/domains/messages/*`
- `apps/api/src/domains/payment/*`
- `apps/api/src/domains/account/*`
- `apps/api/src/domains/feedback/*`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - run `pnpm verify` after all cards in this batch

## Acceptance

- [x] repeated local pagination windows use the shared helper where practical
- [x] helper behavior is covered by focused tests
- [x] response field names and semantics stay unchanged
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added `createApiPaginationWindow` as an API-domain helper for defaults, optional max page size, sliced items, total, and hasMore.
- Adopted the helper in content feed, novel list, managed content queue, notifications, message threads, orders, account asset history, account relations, and feedback tickets.
- Kept route contracts and response field names stable.

## Verification Notes

- `pnpm verify:api`
