# D2 Membership Purchase Unlock Return

## Summary

Implement the novel membership purchase flow so blocked reading surfaces can unlock and return to their original context.

## Goal

Make membership feel like a real product loop instead of a static plan page.

## Scope

- In scope: purchase action, unlock state update, and return to `detail` or `reader`
- In scope: shared membership contract and mock-backed purchase endpoint
- Out of scope: real payment providers

## Affected Paths

- `packages/contracts/src/api/membership.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/novel-h5/src/bootstrap/mock-api.ts`
- `apps/novel-h5/src/render/pages/membership.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
