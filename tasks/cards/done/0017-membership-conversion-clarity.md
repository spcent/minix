# D17 Membership Conversion Clarity

## Summary

Push membership from a working unlock step into a clearer conversion and recovery surface.

## Goal

Make it obvious why a plan is recommended, what gets unlocked immediately, and where the reader returns next.

## Scope

- In scope: stronger recommended-plan framing
- In scope: explicit unlock outcome and return-context copy
- In scope: aligned H5 and WeChat membership messaging
- Out of scope: billing history
- Out of scope: real payment processing

## Affected Paths

- `packages/features/subscription/src/model/index.ts`
- `packages/features/subscription/src/controller/index.ts`
- `packages/features/subscription/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/membership.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] membership clearly explains recommended plan, unlock outcome, and return path
- [x] H5 and WeChat use the same conversion semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
