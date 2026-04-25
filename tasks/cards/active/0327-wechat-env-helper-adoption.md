# WeChat Env Helper Adoption

Status: active

## Summary

Adopt shared core bootstrap env helpers in both WeChat bootstrap env loaders.

## Ownership

- owned files: `apps/host-wechat/src/bootstrap/env.ts`, `apps/novel-wechat/src/bootstrap/env.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:host host-wechat && pnpm verify:host novel-wechat`

## Acceptance

- [ ] both WeChat env loaders remove local boolean parsing duplicates
- [ ] existing override and process env behavior stays unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
