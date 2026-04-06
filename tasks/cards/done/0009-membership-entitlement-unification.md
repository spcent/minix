# P1-2 Membership Entitlement Unification

## Summary

Tighten the membership model so all hosts consume one explicit entitlement story.

## Goal

Remove weak CTA branching based on partial flags and make guest, signed-in, chapter-unlocked, title-unlocked, and member states predictable.

## Scope

- In scope: unify CTA rules across `detail`, `reader`, `toc`, and `membership`
- In scope: make `tier` and `entitlementScope` drive copy and actions everywhere
- In scope: clarify purchase success and return language for each blocked surface
- Out of scope: real payments
- Out of scope: account billing history

## Affected Paths

- `packages/contracts/src/api/membership.ts`
- `packages/features/subscription/src/controller/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/membership.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] all protected novel surfaces derive CTA text from one entitlement model
- [x] purchase success copy explains exactly what was unlocked and where the return path goes
- [x] docs updated if behavior or workflow changed
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
