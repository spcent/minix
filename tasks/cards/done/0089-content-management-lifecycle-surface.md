# Card 0089 Content Management Lifecycle Surface

## Summary

Expand content from shared read/display abstractions into bounded content-management lifecycle workflows.

## Goal

Support draft, publish, review, archive, delete, restore, and access-management semantics as actual shared business flows instead of contract-only content metadata.

## Milestone

- milestone file: none
- slice name: `content management lifecycle surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - introduce content-management contracts and sample API routes for draft/publish/archive/delete/restore/review transitions
  - keep current novel sample as one content-model specialization on top of the generic lifecycle
  - support access-level changes such as public/login/member/purchased visibility
  - align content detail and list surfaces with lifecycle state transitions
  - prepare later content forms to reuse the shared form workflow
- Out of scope:
  - full CMS back office
  - moderation staffing or production review tooling
  - rich-text editor implementation

## Ownership

- owned files:
  - `packages/contracts/src/api/content.ts`
  - optional new content-management feature package under `packages/features/*`
  - selected existing content-oriented feature packages
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests if management pages are added
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source manifests change
- forbidden files:
  - parallel host-only content lifecycle state that bypasses shared content contracts

## Dependencies

- depends on:
  - `0078-content-domain-foundation.md`
  - `0080-form-workflow-foundation.md`
- blocked by:
  - none
- integration notes:
  - do not collapse content consumption and content management into one unreadable feature package if separate ownership is cleaner

## Affected Paths

- `packages/contracts/src/api/content.ts`
- selected `packages/features/*`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for lifecycle transition and review result refinement
- store shape changes allowed:
  - yes, in content-management feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for management entry and return targets

## Verification

- slice gate:
  - at least one bounded content-management flow exists on top of the generic content contracts
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which lifecycle states are sample-backed and which remain reserved

## Acceptance

- [x] content lifecycle states have shared business transitions, not only metadata fields
- [x] content access-level changes can be exercised through shared contracts
- [x] novel sample remains a specialization, not the only usable content model
- [x] lifecycle flows align with shared list/detail/form abstractions
- [x] `pnpm verify` run
