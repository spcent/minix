# Auth Request Constant Foundation

Status: done

## Summary

Add auth contract constants for login platforms, OAuth authorize purposes, identity upgrade methods, and bind workflow kinds.

## Ownership

- owned files: `packages/contracts/src/api/auth.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] remaining auth request string unions have exported constants
- [x] existing auth contract types remain compatible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added login platform, OAuth purpose, identity upgrade method, and bind workflow kind constants.
