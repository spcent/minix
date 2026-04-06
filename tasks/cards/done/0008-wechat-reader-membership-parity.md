# P1-1 WeChat Reader Membership Parity

## Summary

Bring WeChat `novelDetail`, `toc`, `reader`, and `membership` feedback states closer to the H5 experience.

## Goal

Make the Mini Program feel like a real product surface instead of a thinner shell around shared controllers.

## Scope

- In scope: richer locked, trial, and unlocked feedback states in WeChat `detail`, `toc`, `reader`, and `membership`
- In scope: clearer completion, continue, and return actions inside the WeChat reader shell
- In scope: unified membership intercept copy across `detail`, `toc`, and `reader`
- Out of scope: new routes
- Out of scope: new feature packages

## Affected Paths

- `packages/tooling/src/host-wechat-shells.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/subscription/src/controller/index.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] WeChat `detail -> toc -> reader -> membership -> return` feels coherent
- [x] locked, trial, and purchased states use consistent wording and actions
- [x] chapter completion and return actions are visible without relying on H5-specific layout patterns
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
