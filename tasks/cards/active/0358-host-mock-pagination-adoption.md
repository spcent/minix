# Host Mock Pagination Adoption

Status: active

## Summary

Adopt the shared mock pagination helper in official host item mock adapters.

## Goal

Host H5 and Host WeChat should expose the same mock list pagination behavior without maintaining duplicate list slicing code.

## Scope

- In scope:
  - refactor host item mock adapters to use the core pagination helper
  - preserve current token and response behavior
- Out of scope:
  - novel catalog mock data consolidation
  - changing official host manifests

## Ownership

- owned files:
  - `apps/host-h5/src/bootstrap/mock-api.ts`
  - `apps/host-wechat/src/bootstrap/mock-api.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:host host-h5` and `pnpm verify:host host-wechat`

## Acceptance

- [ ] Host H5 item mock pagination uses the shared helper
- [ ] Host WeChat item mock pagination uses the shared helper
- [ ] mock route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
