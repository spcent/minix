# D22 Membership And Reading Center Retention Layer

## Summary

Push membership and settings away from interruption-only surfaces toward calmer retention and continuity layers.

## Goal

Make membership explain post-purchase stability and make Reading Center explain how the product stays useful between sessions.

## Scope

- In scope: calmer retention framing for H5 membership
- In scope: calmer retention framing for H5 reading center
- In scope: WeChat parity for membership and settings shells
- Out of scope: new persistence or settings contracts
- Out of scope: billing history or lifecycle emails

## Affected Paths

- `apps/novel-h5/src/render/pages/membership.ts`
- `apps/novel-h5/src/render/pages/settings.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] membership reads more like a retention surface after unlock
- [x] reading center reads more like a long-term continuity layer
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
