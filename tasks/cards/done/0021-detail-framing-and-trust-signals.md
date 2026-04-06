# D21 Detail Framing And Trust Signals

## Summary

Push the title detail surface further from raw metadata toward a clearer reading decision page.

## Goal

Make reputation, cadence, trial rules, and shelf consequences easier to understand through shared novel-detail state.

## Scope

- In scope: shared detail framing summaries
- In scope: H5 detail trust copy
- In scope: WeChat detail trust-copy parity
- Out of scope: new backend detail fields
- Out of scope: community reviews or comments

## Affected Paths

- `packages/features/novel-detail/src/model/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/novel-detail/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/novel-detail.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] detail explains reputation, cadence, trial rules, and shelf implications through shared state
- [x] H5 and WeChat share the same detail-framing semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
