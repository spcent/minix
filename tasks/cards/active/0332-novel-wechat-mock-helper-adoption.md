# Novel WeChat Mock Helper Adoption

Status: active

## Summary

Adopt shared core mock request helpers in the Novel WeChat mock adapter.

## Ownership

- owned files: `apps/novel-wechat/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-wechat`

## Acceptance

- [ ] Novel WeChat mock adapter removes local response, path, and query coercion duplicates
- [ ] mock route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
