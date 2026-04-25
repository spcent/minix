# Host H5 Env Helper Adoption

Status: active

## Summary

Adopt shared core bootstrap env helpers in the Host H5 bootstrap env loader.

## Ownership

- owned files: `apps/host-h5/src/bootstrap/env.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-h5`

## Acceptance

- [ ] Host H5 env loader removes local boolean and query parsing duplicates
- [ ] existing override, process env, and query behavior stays unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
