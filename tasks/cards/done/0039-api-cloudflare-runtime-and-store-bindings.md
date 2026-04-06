# Card 0039 API Cloudflare Runtime And Store Bindings

## Summary

Move `apps/api` from a Node-only local server into a Cloudflare-oriented runtime shape with explicit Worker bindings and persistent storage adapters.

## Goal

Let the API run the same contract on local development and Cloudflare targets instead of stopping at an in-memory Node server.

## Milestone

- milestone file: none
- slice name: `api cloudflare runtime foundation`

## Scope

- In scope:
  - add Worker-compatible entrypoints and runtime wiring
  - introduce explicit bindings for persistent storage used by auth and user state
  - add local development configuration for the chosen Cloudflare resources
  - keep the existing Node local server path or replace it with a clear equivalent local dev workflow
- Out of scope:
  - changing sample host routes
  - redesigning feature contracts
  - replacing all sample fixture content

## Ownership

- owned files:
  - `apps/api/**`
  - root scripts or config needed to run the API locally and in Cloudflare
  - API runtime docs
- allowed generated outputs:
  - lockfile updates
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`
  - `apps/host-*/src/manifest/**`
  - `apps/novel-*/src/manifest/**`

## Dependencies

- depends on:
  - `apps/api/**`
- blocked by:
  - storage backend choice
- integration notes:
  - preserve the fetch-first app shape so local smoke and Worker deployment can share the same route logic

## Affected Paths

- `apps/api/**`
- root API scripts or Cloudflare config files
- API docs

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none unless storage-backed semantics require stable error codes
- store shape changes allowed:
  - API-internal store contracts only
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - API tests plus local Cloudflare-oriented startup check
- generation needed:
  - none
- final verifier handoff:
  - prove the same route surface works in local development and the Cloudflare target runtime

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
