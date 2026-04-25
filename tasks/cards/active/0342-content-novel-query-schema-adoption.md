# Content Novel Query Schema Adoption

Status: active

## Summary

Adopt novel contract constants in content-domain novel query schemas.

## Ownership

- owned files: `apps/api/src/domains/content/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] novel list status and sort schemas reuse novel contract constants
- [ ] novel list route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
