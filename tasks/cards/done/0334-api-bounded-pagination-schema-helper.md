# API Bounded Pagination Schema Helper

Status: done

## Summary

Add API-domain helpers for bounded page-size query schemas used by list endpoints.

## Ownership

- owned files: `apps/api/src/domains/schema-helpers.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] bounded page-size helpers cover 50 and 100 item limits without changing parsing semantics
- [x] helpers stay local to API domains
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added reusable bounded page-size schema helpers for 50 and 100 item query limits.
