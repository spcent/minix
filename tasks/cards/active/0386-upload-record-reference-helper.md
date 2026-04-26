# Upload Record Reference Helper

Status: active

## Summary

Add a shared helper for cloning upload references with source and actor context snapshots.

## Goal

Upload reference snapshots should use the same optional context clone convention outside pipeline-private helpers.

## Scope

- In scope:
  - add upload reference clone helper
  - cover source and actor context clone isolation
- Out of scope:
  - changing reference owner summary behavior
  - changing upload attach contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/records.ts`
  - `apps/api/src/domains/uploads/records.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] upload reference helper preserves owner fields
- [ ] source context is cloned
- [ ] actor context is cloned
- [ ] `pnpm verify` run, or skipped with reason if docs-only
