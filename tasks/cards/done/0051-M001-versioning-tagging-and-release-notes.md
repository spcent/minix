# M001 Card 0051 Versioning Tagging And Release Notes

## Summary

Close the gap between `v1.0` release intent and the repository's current `0.1.0` versioning and release-communication state.

## Goal

Make the final release package, tag, and announcement story explicit so `v1.0` is not shipped with stale `0.1` semantics or ambiguous upgrade guidance.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `version and release communication`

## Scope

- In scope:
  - define the package version bump path for the release commit
  - document tag naming and release-note expectations
  - add or update changelog or release-note templates as needed
  - align `README`, milestone docs, and package metadata with the final release naming
- Out of scope:
  - publishing to a package registry
  - rewriting historical release history
  - changing runtime behavior

## Ownership

- owned files:
  - `README.md`
  - `package.json`
  - `docs/**`
  - `tasks/milestones/**`
  - optional changelog or release-note files at repo root
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0030-M001-release-scope-freeze.md`
  - `0047-M001-release-runbook-and-manual-wechat-gate.md`
- blocked by:
  - final go or no-go decision for the `v1.0` tag
- integration notes:
  - version naming should match the actual release message, not just the docs

## Affected Paths

- `README.md`
- `package.json`
- `docs/**`
- `tasks/milestones/**`
- optional `CHANGELOG.md`

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
  - version, tag, and release-note docs agree on the `v1.0` release naming
- generation needed:
  - none
- final verifier handoff:
  - record the exact release tag and release-note source of truth
- verification note:
  - docs-only slice; `pnpm verify` intentionally skipped

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
