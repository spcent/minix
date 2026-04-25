# Novel H5 Env Helper Adoption

Status: done

## Summary

Adopt shared core bootstrap env helpers in the Novel H5 bootstrap env loader.

## Ownership

- owned files: `apps/novel-h5/src/bootstrap/env.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-h5`

## Acceptance

- [x] Novel H5 env loader removes local boolean and query parsing duplicates
- [x] existing override, process env, and query behavior stays unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced local Novel H5 env parsing helpers with exported core bootstrap helpers.
