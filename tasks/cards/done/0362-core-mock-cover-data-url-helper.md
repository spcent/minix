# Core Mock Cover Data URL Helper

Status: done

## Summary

Add a shared core helper for deterministic mock SVG cover data URLs.

## Goal

Official mock adapters should reuse a single data-only helper for generated sample covers instead of duplicating the same inline SVG data URL builder.

## Scope

- In scope:
  - add a generic mock SVG cover data URL helper under core mock request helpers
  - add focused runtime tests for deterministic encoding
- Out of scope:
  - moving product-specific cover palettes or titles into core
  - changing real sample asset routes

## Ownership

- owned files:
  - `packages/core/src/runtime/mock-request.ts`
  - `packages/core/src/runtime/mock-request.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - app mock adapters

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [x] mock cover helper is exported through `@minix/core`
- [x] helper keeps product-specific cover inputs caller-owned
- [x] runtime tests cover generated data URL content
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `createMockSvgCoverDataUrl` to core mock request helpers.
- Covered deterministic data URL prefix, title encoding, and accent color preservation.
- Ran `pnpm test -- packages/core/src/runtime/*.test.ts`; the repo test script executed successfully.
