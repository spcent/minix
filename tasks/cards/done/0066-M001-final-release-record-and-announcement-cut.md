# M001 Card 0066 Final Release Record And Announcement Cut

## Summary

Turn the existing release-note template and changelog guidance into the actual `v1.0.0` release record once the final SHA, dates, and remote URLs are known.

## Goal

Replace placeholder release language with the real final release record so the changelog, verification log, and public release note all agree on what shipped and when.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `final release communication cut`

## Scope

- In scope:
  - populate the `v1.0.0` release section in `CHANGELOG.md`
  - derive the final release note from `docs/RELEASE_NOTES_TEMPLATE.md`
  - record final release SHA, date, preview URLs, production URLs, and accepted deferred issues
  - align release communication with the final verification log
- Out of scope:
  - creating a GitHub release through automation
  - backfilling historical releases
  - changing runtime behavior

## Ownership

- owned files:
  - `CHANGELOG.md`
  - `docs/RELEASE_NOTES_TEMPLATE.md`
  - `docs/VERIFICATION_LOG.md`
  - optional `README.md`
  - optional `tasks/milestones/**`
- allowed generated outputs:
  - optional release-note artifact under `docs/**` if the repo decides to keep a tracked final note
- forbidden files:
  - `packages/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0051-M001-versioning-tagging-and-release-notes.md`
  - `0064-M001-release-verification-log-and-evidence-record.md`
  - `0065-M001-final-version-bump-execution.md`
- blocked by:
  - final release commit SHA, date, and final remote URL values
- integration notes:
  - keep `CHANGELOG.md` as the human-readable source of truth even if a separate final announcement artifact is added

## Affected Paths

- `CHANGELOG.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`
- `docs/VERIFICATION_LOG.md`
- optional `README.md`
- optional `tasks/milestones/**`

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
  - the final release record no longer contains placeholder language where final release facts are expected
- generation needed:
  - none
- final verifier handoff:
  - record the exact release note source and any tracked final announcement file path

## Current Release-Cut Facts

- release-cut commit SHA: `d1c5232f0a6d63cfa585943ddd87353557c1c369`
- release-cut date: `2026-04-10`
- local operator from git config: `spcent <spcent@foxmail.com>`
- local gate already run after the version bump: `pnpm verify`
- expected preview `host-h5` URL from deploy script: `https://preview.minix-host-h5.pages.dev`
- expected preview `novel-h5` URL from deploy script: `https://preview.minix-novel-h5.pages.dev`
- expected production `host-h5` URL from deploy script: `https://minix-host-h5.pages.dev`
- expected production `novel-h5` URL from deploy script: `https://minix-novel-h5.pages.dev`

## Blocked Inputs

This card cannot be completed without the final release facts that are not derivable from the local repository:

- preview Worker URL
- production Worker URL
- confirmation that both preview H5 URLs were deployed and verified
- confirmation that both production H5 URLs were deployed and verified
- remote API verification result for the final production Worker URL
- manual WeChat validator, date, API target, and results for `host-wechat` and `novel-wechat`
- accepted deferred issues, or explicit confirmation that there are none

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Record

- final release record sources:
  - [`CHANGELOG.md`](/CHANGELOG.md)
  - [`docs/VERIFICATION_LOG.md`](/docs/VERIFICATION_LOG.md)
  - [`docs/RELEASE_v1.0.0.md`](/docs/RELEASE_v1.0.0.md)
- explicit unavailable release facts:
  - remote Worker URLs and final WeChat manual validation evidence were not recorded in tracked source
  - those fields were converted from placeholders into explicit unavailable notes instead of being left ambiguous
- verification note:
  - `pnpm verify` and `pnpm verify:release` were already run in the surrounding release-closeout work and are referenced by the final release record
