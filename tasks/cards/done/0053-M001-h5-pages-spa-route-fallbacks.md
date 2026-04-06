# M001 Card 0053 H5 Pages SPA Route Fallbacks

## Summary

Make the official H5 samples safe to serve from Cloudflare Pages by adding explicit SPA deep-link fallbacks instead of relying on localhost-style root entry only.

## Goal

Ensure refresh, direct entry, and shared links to H5 routes such as `/overview`, `/preferences`, `/catalog`, `/reader`, or `/membership` do not 404 on Pages.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `remote h5 route survivability`

## Scope

- In scope:
  - define the Pages fallback strategy for `host-h5` and `novel-h5`
  - add any required `_redirects`, `_routes`, or equivalent static-host files
  - make sure the H5 build and deploy path preserves those fallback files
  - document the route-survival behavior for remote deploys
- Out of scope:
  - changing route ids or route params
  - introducing server-side rendering
  - redesigning page structure

## Ownership

- owned files:
  - `apps/host-h5/**`
  - `apps/novel-h5/**`
  - `scripts/**`
  - `README.md`
  - `docs/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`

## Dependencies

- depends on:
  - `0048-M001-h5-remote-host-deploy-and-origin-alignment.md`
- blocked by:
  - none
- integration notes:
  - the final remote URL proof for `0048` is not credible until route refresh and direct-entry behavior are preserved

## Affected Paths

- `apps/host-h5/**`
- `apps/novel-h5/**`
- `scripts/**`
- `README.md`
- `docs/**`

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
  - remote or local static-host simulation can load deep links for both official H5 samples without 404
- generation needed:
  - none
- final verifier handoff:
  - record the exact fallback files or Pages settings needed for SPA route survival

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
