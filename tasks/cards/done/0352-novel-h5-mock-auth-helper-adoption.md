# Novel H5 Mock Auth Helper Adoption

Status: done

## Summary

Adopt core mock auth header helper in the Novel H5 mock adapter.

## Ownership

- owned files: `apps/novel-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-h5`

## Acceptance

- [x] Novel H5 mock adapter removes duplicated Bearer token matching
- [x] mock auth behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused the shared mock Bearer authorization matcher in the Novel H5 mock adapter.
