# M001 Card 0054 H5 Release Security Headers And Cache Policy

## Summary

Define a minimal release-grade headers and caching policy for the official H5 samples when served from Cloudflare Pages.

## Goal

Avoid shipping the remote H5 samples with unspecified browser security and cache behavior by making the static-host policy explicit and supportable.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `remote h5 browser hardening`

## Scope

- In scope:
  - define a minimum header policy for the H5 Pages deployments
  - decide which headers should be set by static config, such as content type, frame policy, or referrer policy
  - define cache behavior for `index.html` versus fingerprinted or non-fingerprinted assets
  - document the policy and any Pages-specific config files
- Out of scope:
  - a full web-app security program
  - backend auth or CSP nonce infrastructure
  - changing shared runtime contracts

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
  - `apps/api/**`

## Dependencies

- depends on:
  - `0048-M001-h5-remote-host-deploy-and-origin-alignment.md`
- blocked by:
  - none
- integration notes:
  - avoid policies that break the existing bootstrap script injection or local preview workflow

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
  - the chosen static-host header and cache policy is documented and can be validated against the built H5 output
- generation needed:
  - none
- final verifier handoff:
  - record which headers and cache rules are required for Pages-hosted release builds

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
