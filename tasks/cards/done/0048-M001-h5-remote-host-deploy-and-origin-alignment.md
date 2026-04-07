# M001 Card 0048 H5 Remote Host Deploy And Origin Alignment

## Summary

Deploy the official H5 samples to a real remote host and align API origin policy so `v1.0` is not effectively localhost-only.

## Goal

Make `apps/host-h5` and `apps/novel-h5` reachable in preview and production through stable remote URLs, with explicit API base URL and CORS behavior that matches the deployed host origins.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `remote h5 release surface`

## Scope

- In scope:
  - choose and document the remote hosting path for the two official H5 samples
  - add preview and production host URL conventions for `host-h5` and `novel-h5`
  - align API CORS and sample bootstrap docs with the real remote H5 origins
  - ensure H5 release docs no longer assume localhost as the only deploy target
- Out of scope:
  - redesigning the H5 apps
  - changing shared controller contracts
  - introducing a new frontend framework

## Ownership

- owned files:
  - `README.md`
  - `apps/host-h5/**`
  - `apps/novel-h5/**`
  - `apps/api/**`
  - `docs/**`
  - optional `scripts/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`

## Dependencies

- depends on:
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
  - `0045-M001-h5-blackbox-release-smoke.md`
  - `0046-M001-official-sample-assets-and-content-hardening.md`
- blocked by:
  - final decision on the remote H5 hosting provider and domain pattern
- integration notes:
  - remote H5 origins must align with the API `MINIX_CORS_ALLOWED_ORIGINS` story instead of relying on localhost defaults

## Affected Paths

- `README.md`
- `apps/host-h5/**`
- `apps/novel-h5/**`
- `apps/api/**`
- `docs/**`
- `scripts/**`

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
  - deployed H5 preview URLs can reach the intended preview API without CORS failure
- generation needed:
  - none
- final verifier handoff:
  - record preview and production H5 host URLs and how they connect to the API

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
