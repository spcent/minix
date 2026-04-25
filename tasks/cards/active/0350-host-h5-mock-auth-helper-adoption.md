# Host H5 Mock Auth Helper Adoption

Status: active

## Summary

Adopt core mock auth header helper in the Host H5 mock adapter.

## Ownership

- owned files: `apps/host-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-h5`

## Acceptance

- [ ] Host H5 mock adapter removes duplicated Bearer token string construction
- [ ] mock auth behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
