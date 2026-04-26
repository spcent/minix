# Host Mock Pagination Adoption

Status: done

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

- [x] Host H5 item mock pagination uses the shared helper
- [x] Host WeChat item mock pagination uses the shared helper
- [x] mock route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced Host H5 and Host WeChat local item pagination slicing with `paginateMockItems`.
- Tightened API schema normalizer return types after the host gates surfaced full `exactOptionalPropertyTypes` checks from earlier schema-helper work.
- Ran `pnpm typecheck`, `pnpm verify:host host-h5`, and `pnpm verify:host host-wechat`; all passed.
