# M001 Card 0037 Novel Sample Release Alignment

## Summary

Decide and implement the minimum novel-sample alignment needed so richer sample apps do not drift away from the `v1.0` release contract.

## Goal

Keep novel apps useful as official or near-official samples without allowing their richer feature set to silently redefine the main `v1.0` kernel promise.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `novel sample release alignment`

## Scope

- In scope:
  - identify novel capabilities that must stay sample-local versus those that require formal shared interfaces before release
  - align novel manifests, features, and docs with the frozen `v1.0` support story
  - resolve any immediate contract mismatches between novel samples and the release-facing runtime
  - document remaining post-`v1.0` extraction work
- Out of scope:
  - full novel product polish backlog
  - new novel routes
  - making every novel feature part of the main host flow

## Ownership

- owned files:
  - `packages/features/bookshelf/**`
  - `packages/features/catalog/**`
  - `packages/features/novel-detail/**`
  - `packages/features/reader/**`
  - `packages/features/subscription/**`
  - `packages/features/toc/**`
  - `apps/novel-h5/src/bootstrap/**`
  - `apps/novel-h5/src/manifest/**`
  - `apps/novel-wechat/src/bootstrap/**`
  - `apps/novel-wechat/src/manifest/**`
  - related novel docs and task notes if needed
- allowed generated outputs:
  - `apps/novel-h5/src/manifest/*.ts`
  - `apps/novel-wechat/src/manifest/*.ts`
  - `apps/novel-wechat/src/registrations/page-registry.ts`
  - `apps/novel-wechat/miniprogram/pages/**`
- forbidden files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/core/src/runtime/**`
  - `apps/host-h5/**`
  - `apps/host-wechat/**`

## Dependencies

- depends on:
  - `0030-M001-release-scope-freeze.md`
- blocked by:
  - release decision on whether novel apps are official `v1.0` support surface or advanced samples
- integration notes:
  - do not widen main-host contracts from inside this card; hand off any needed shared extraction to a follow-up milestone if not release-critical

## Affected Paths

- `packages/features/bookshelf/*`
- `packages/features/catalog/*`
- `packages/features/novel-detail/*`
- `packages/features/reader/*`
- `packages/features/subscription/*`
- `packages/features/toc/*`
- `apps/novel-h5/src/bootstrap/*`
- `apps/novel-h5/src/manifest/*`
- `apps/novel-wechat/src/bootstrap/*`
- `apps/novel-wechat/src/manifest/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - none unless explicitly approved as release-critical shared extraction
- store shape changes allowed:
  - sample-local feature store changes only
- controller action changes allowed:
  - sample-local controller changes only
- route param changes allowed:
  - none unless tied to already-frozen sample behavior

## Verification

- slice gate:
  - targeted novel feature tests and host checks
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - document which novel capabilities remain sample-local after `v1.0`

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
