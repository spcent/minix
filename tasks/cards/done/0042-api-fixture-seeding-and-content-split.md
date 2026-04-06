# Card 0042 API Fixture Seeding And Content Split

## Summary

Separate the API's large hardcoded sample data from route logic so official sample content can be seeded, versioned, and evolved without turning `app.ts` and `data.ts` into a permanent monolith.

## Goal

Keep the sample backend maintainable as the novel sample surface grows and as persistent storage is introduced.

## Milestone

- milestone file: none
- slice name: `api sample data organization`

## Scope

- In scope:
  - move large fixture datasets into clearer seed or content modules
  - define how local sample data is initialized into storage-backed environments
  - reduce coupling between route handlers and embedded sample content
  - document the supported seed workflow for the official samples
- Out of scope:
  - building an authoring CMS
  - changing the frozen sample route surface
  - production recommendation systems

## Ownership

- owned files:
  - `apps/api/**`
  - API seed docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/features/**`

## Dependencies

- depends on:
  - `apps/api/**`
  - `0039-api-cloudflare-runtime-and-store-bindings.md`
- blocked by:
  - seed storage strategy
- integration notes:
  - preserve current sample responses while changing how fixture content is organized and loaded

## Affected Paths

- `apps/api/**`
- API docs

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - API-internal seed and content storage only
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - API tests plus seed-load verification
- generation needed:
  - none
- final verifier handoff:
  - prove the seeded API returns the same contract surface as the current hardcoded sample backend

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
