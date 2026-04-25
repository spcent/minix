# Novel H5 Mock Helper Adoption

Status: active

## Summary

Adopt shared core mock request helpers in the Novel H5 mock adapter.

## Ownership

- owned files: `apps/novel-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-h5`

## Acceptance

- [ ] Novel H5 mock adapter removes local response, path, and query coercion duplicates
- [ ] mock route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
