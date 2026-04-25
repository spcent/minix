# Host H5 Mock Auth Helper Adoption

Status: done

## Summary

Adopt core mock auth header helper in the Host H5 mock adapter.

## Ownership

- owned files: `apps/host-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-h5`

## Acceptance

- [x] Host H5 mock adapter removes duplicated Bearer token string construction
- [x] mock auth behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused the shared mock Bearer authorization matcher in the Host H5 mock adapter.
