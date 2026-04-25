# Novel WeChat Mock Auth Helper Adoption

Status: active

## Summary

Adopt core mock auth header helper in the Novel WeChat mock adapter.

## Ownership

- owned files: `apps/novel-wechat/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-wechat`

## Acceptance

- [ ] Novel WeChat mock adapter removes duplicated Bearer token matching
- [ ] mock auth behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
