# M001 Card 0043 Cloudflare Remote API Deploy And Env Promotion

## Summary

Promote `apps/api` from local-only Worker + D1 development into a real preview and production deployment path with explicit Cloudflare resource wiring.

## Goal

Ensure the official `v1.0` samples can point at a real remotely deployed API instead of stopping at `localhost:3000` or placeholder Worker configuration.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `remote api deployment`

## Scope

- In scope:
  - replace placeholder D1 configuration with documented preview and production resource setup
  - define required Worker env vars, secrets, and promotion flow for preview and production
  - add deploy or verify scripts for remote migration and remote Worker rollout
  - document how official samples switch from local API to preview or production API
- Out of scope:
  - redesigning the API contract surface
  - introducing non-Cloudflare deployment targets
  - building a generalized infra platform

## Ownership

- owned files:
  - `apps/api/**`
  - `package.json`
  - `scripts/**` related to deploy or remote verification
  - optional `.github/workflows/**`
  - relevant docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`
  - `apps/host-*/src/manifest/**`
  - `apps/novel-*/src/manifest/**`

## Dependencies

- depends on:
  - `0039-api-cloudflare-runtime-and-store-bindings.md`
- blocked by:
  - real Cloudflare account resources for preview and production
- integration notes:
  - keep local `wrangler dev` and local D1 flows working while adding remote promotion

## Affected Paths

- `apps/api/**`
- `package.json`
- `scripts/*`
- `.github/workflows/*`
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
  - local worker verification must still pass
  - remote migration and remote Worker verification command path must be documented and runnable
- generation needed:
  - none
- final verifier handoff:
  - record the preview and production deploy commands, required secrets, and rollback path

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
