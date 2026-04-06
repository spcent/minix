# M001 Card 0046 Official Sample Assets And Content Hardening

## Summary

Replace placeholder external sample assets and tighten the official sample content path so `v1.0` does not ship with brittle `example.com` dependencies.

## Goal

Make the official samples presentable and stable in real deployed environments by ensuring their content and media references are controlled by MiniX rather than placeholder hosts.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `sample content hardening`

## Scope

- In scope:
  - inventory sample assets and external placeholder dependencies used by the official hosts and API
  - replace `example.com` cover and avatar references with controlled sample assets or a documented local asset path
  - document how official sample content is versioned and updated
  - keep sample responses and UI meaning stable while removing placeholder transport dependencies
- Out of scope:
  - building an editorial CMS
  - large copywriting or visual redesign work
  - adding new sample routes

## Ownership

- owned files:
  - `apps/api/**`
  - `apps/novel-h5/**` where asset references are sample-owned
  - `apps/novel-wechat/**` where asset references are sample-owned
  - relevant docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`

## Dependencies

- depends on:
  - `0042-api-fixture-seeding-and-content-split.md`
- blocked by:
  - final decision on where official sample assets are hosted
- integration notes:
  - preserve contract-compatible sample payloads while changing the source of media and static content

## Affected Paths

- `apps/api/**`
- `apps/novel-h5/**`
- `apps/novel-wechat/**`
- `README.md`
- `docs/*`

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
  - API tests and official integration verification still pass after asset and content source changes
- generation needed:
  - none
- final verifier handoff:
  - record where official sample media comes from and how to refresh it without breaking hosts

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
