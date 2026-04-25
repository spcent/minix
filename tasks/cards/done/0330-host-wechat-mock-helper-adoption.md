# Host WeChat Mock Helper Adoption

Status: done

## Summary

Adopt shared core mock request helpers in the Host WeChat mock adapter.

## Ownership

- owned files: `apps/host-wechat/src/bootstrap/mock-api.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-wechat`

## Acceptance

- [x] Host WeChat mock adapter removes local response, path, and number coercion duplicates
- [x] mock route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced Host WeChat local mock response, path, and query number helpers with core mock request helpers.
