# Host H5 Mock Helper Adoption

Status: done

## Summary

Adopt shared core mock request helpers in the Host H5 mock adapter.

## Ownership

- owned files: `apps/host-h5/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-h5`

## Acceptance

- [x] Host H5 mock adapter removes local response, path, and number coercion duplicates
- [x] mock route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced Host H5 local mock response, path, and query number helpers with core mock request helpers.
