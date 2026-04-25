# Content Novel Query Schema Adoption

Status: done

## Summary

Adopt novel contract constants in content-domain novel query schemas.

## Ownership

- owned files: `apps/api/src/domains/content/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] novel list status and sort schemas reuse novel contract constants
- [x] novel list route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated novel status and sort enums with novel contract constants.
