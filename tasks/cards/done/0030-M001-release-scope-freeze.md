# M001 Card 0030 Release Scope Freeze

## Summary

Freeze the `v1.0` release promise, official support surface, and non-goals before shared runtime and host changes begin.

## Goal

Give the repo one explicit `v1.0` target so later cards do not widen scope or implement mutually inconsistent release assumptions.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `release scope and docs freeze`

## Scope

- In scope:
  - define whether `v1.0` is shipping kernel-only guidance or kernel plus official host samples
  - define the official support matrix for `host-h5`, `host-wechat`, `novel-h5`, and `novel-wechat`
  - align `README`, architecture docs, roadmap notes, and repo specs with the same release story
  - capture explicit `v1.0` non-goals and deferred capabilities
- Out of scope:
  - changing runtime code
  - changing feature store shapes
  - changing host manifests or generated outputs

## Ownership

- owned files:
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `specs/repo.yaml`
  - `tasks/milestones/M001-v1.0-release-readiness.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/contracts/**`
  - `packages/core/**`
  - `packages/features/**`
  - `packages/platform-*/**`
  - `apps/**`

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - later cards should treat this card as the source for release scope and non-goals

## Affected Paths

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `specs/repo.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - docs/spec review only
- generation needed:
  - none
- final verifier handoff:
  - document the frozen `v1.0` support matrix and deferred items for all later cards

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
