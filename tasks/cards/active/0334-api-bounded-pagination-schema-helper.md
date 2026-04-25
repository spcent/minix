# API Bounded Pagination Schema Helper

Status: active

## Summary

Add API-domain helpers for bounded page-size query schemas used by list endpoints.

## Ownership

- owned files: `apps/api/src/domains/schema-helpers.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] bounded page-size helpers cover 50 and 100 item limits without changing parsing semantics
- [ ] helpers stay local to API domains
- [ ] `pnpm verify` run, or skipped with reason if docs-only
