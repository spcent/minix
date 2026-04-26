# Novel Mock Pagination Adoption

Status: done

## Summary

Adopt the shared mock pagination helper in novel H5 and WeChat catalog mocks.

## Goal

Novel host mock catalog pagination should share the same pagination envelope behavior as the generic host item mocks while keeping novel filtering and sorting host-owned.

## Scope

- In scope:
  - refactor `listNovels` in Novel H5 and Novel WeChat mock adapters
  - preserve category, status, keyword, and sort behavior
- Out of scope:
  - consolidating novel fixture data
  - changing catalog contracts

## Ownership

- owned files:
  - `apps/novel-h5/src/bootstrap/mock-api.ts`
  - `apps/novel-wechat/src/bootstrap/mock-api.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:host novel-h5` and `pnpm verify:host novel-wechat`

## Acceptance

- [x] Novel H5 catalog pagination uses `paginateMockItems`
- [x] Novel WeChat catalog pagination uses `paginateMockItems`
- [x] mock list behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused `paginateMockItems` for Novel H5 and Novel WeChat catalog mock pagination.
- Kept novel-specific filtering, sorting, and search metadata local to each mock adapter.
- Ran `pnpm verify:host novel-h5` and `pnpm verify:host novel-wechat`; both passed.
