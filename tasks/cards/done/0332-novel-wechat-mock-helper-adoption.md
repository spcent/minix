# Novel WeChat Mock Helper Adoption

Status: done

## Summary

Adopt shared core mock request helpers in the Novel WeChat mock adapter.

## Ownership

- owned files: `apps/novel-wechat/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-wechat`

## Acceptance

- [x] Novel WeChat mock adapter removes local response, path, and query coercion duplicates
- [x] mock route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced Novel WeChat local mock response, path, query number, and query string helpers with core mock request helpers.
