# M001 Card 0065 Final Version Bump Execution

## Summary

Execute the coordinated tracked-version bump from `0.1.0` to `1.0.0` across package manifests, runtime version stamps, and affected tests as the final release-closeout change.

## Goal

Turn the documented versioning plan into a real release commit so MiniX does not ship a `v1.0.0` tag while tracked manifests and runtime identity still report `0.1.0`.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `final tracked version execution`

## Scope

- In scope:
  - bump tracked package manifests from `0.1.0` to `1.0.0`
  - bump tracked runtime version defaults in host bootstraps and API-reported app metadata where `0.1.0` is currently emitted
  - update tests that intentionally assert the tracked version value
  - keep release docs aligned with the now-executed bump
- Out of scope:
  - changing release tag naming
  - publishing packages to a registry
  - changing the supported product surface

## Ownership

- owned files:
  - `package.json`
  - `apps/**/package.json`
  - `packages/**/package.json`
  - `apps/**/src/bootstrap/*`
  - `apps/api/src/*`
  - affected tests that assert runtime version values
  - optional `README.md`
  - optional `docs/**`
- allowed generated outputs:
  - any generated host manifests or shell files required if bootstrap source changes force regeneration
- forbidden files:
  - unrelated feature behavior files

## Dependencies

- depends on:
  - `0051-M001-versioning-tagging-and-release-notes.md`
  - `0064-M001-release-verification-log-and-evidence-record.md`
- blocked by:
  - final go or no-go decision for the `v1.0.0` release commit
- integration notes:
  - this card should happen once, in one coordinated pass, near the final release cut

## Affected Paths

- `package.json`
- `apps/**/package.json`
- `packages/**/package.json`
- `apps/**/src/bootstrap/*`
- `apps/api/src/*`
- affected tests
- optional `README.md`
- optional `docs/**`

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
  - no tracked manifest or runtime version stamp still reports `0.1.0` after the coordinated release bump
- generation needed:
  - run `pnpm gen:manifests` and `pnpm gen:shells` only if bootstrap or manifest sources require it
- final verifier handoff:
  - record the final list of files touched by the coordinated `1.0.0` bump

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
