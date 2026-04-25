# Novel H5 Env Helper Adoption

Status: active

## Summary

Adopt shared core bootstrap env helpers in the Novel H5 bootstrap env loader.

## Ownership

- owned files: `apps/novel-h5/src/bootstrap/env.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-h5`

## Acceptance

- [ ] Novel H5 env loader removes local boolean and query parsing duplicates
- [ ] existing override, process env, and query behavior stays unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
