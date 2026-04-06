# Card 0038 API H5 CORS And Origin Policy

## Summary

Add explicit CORS and local origin policy support so the H5 sample apps can call `apps/api` from browser runtimes instead of only from Node-based smoke scripts.

## Goal

Make the local Hono API usable from `apps/host-h5` and `apps/novel-h5` in real browser sessions without cross-origin request failures.

## Milestone

- milestone file: none
- slice name: `api local browser compatibility`

## Scope

- In scope:
  - add CORS middleware or equivalent response headers for local H5 origins
  - define allowed origins for local development and future preview environments
  - handle preflight requests for JSON and Authorization headers
  - document the expected local origin matrix for the official H5 sample apps
- Out of scope:
  - Cloudflare deployment
  - auth model redesign
  - WeChat domain whitelisting policy

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/README.md`
  - `README.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`
  - `apps/*/src/manifest/**`

## Dependencies

- depends on:
  - `apps/api/**`
- blocked by:
  - none
- integration notes:
  - keep H5 local dev working for both `http://localhost:4173` and `http://localhost:4174`

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/README.md`
- `README.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

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
  - browser-origin request check against local H5 hosts
- generation needed:
  - none
- final verifier handoff:
  - confirm real browser requests to `http://localhost:3000` no longer fail on CORS

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
