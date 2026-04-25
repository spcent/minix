# Novel WeChat Mock Auth Helper Adoption

Status: done

## Summary

Adopt core mock auth header helper in the Novel WeChat mock adapter.

## Ownership

- owned files: `apps/novel-wechat/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host novel-wechat`

## Acceptance

- [x] Novel WeChat mock adapter removes duplicated Bearer token matching
- [x] mock auth behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused the shared mock Bearer authorization matcher in the Novel WeChat mock adapter.
