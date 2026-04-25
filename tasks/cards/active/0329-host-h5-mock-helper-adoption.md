# Host H5 Mock Helper Adoption

Status: active

## Summary

Adopt shared core mock request helpers in the Host H5 mock adapter.

## Ownership

- owned files: `apps/host-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-h5`

## Acceptance

- [ ] Host H5 mock adapter removes local response, path, and number coercion duplicates
- [ ] mock route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
