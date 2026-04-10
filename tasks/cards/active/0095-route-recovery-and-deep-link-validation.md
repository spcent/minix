# Card 0095 Route Recovery And Deep Link Validation

## Summary

Finish the advanced routing and return-flow coverage that remains after the first-stage auth and guard unification work.

## Goal

Validate and harden deep-link entry, multi-step return-path recovery, source passthrough, and forced reauth continuation across the expanded business surface.

## Milestone

- milestone file: none
- slice name: `route recovery and deep link validation`

## Priority

- priority: `P2`

## Scope

- In scope:
  - validate source passthrough and redirect-target behavior across more business domains
  - harden deep-link entry and recovery for protected routes
  - test and refine multi-step return flows after auth, payment, and share-entry interruptions
  - keep route recovery centralized instead of letting each feature drift into bespoke redirect logic again
- Out of scope:
  - introducing a second routing system
  - host-specific handwritten route maps

## Ownership

- owned files:
  - `packages/core/src/runtime/auth.ts`
  - `packages/core/src/runtime/manifest.ts`
  - selected `packages/features/*`
  - selected host source manifests if route metadata changes
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source manifests change
- forbidden files:
  - handwritten generated host outputs

## Dependencies

- depends on:
  - `0070-auth-route-enforcement-and-redirect-unification.md`
  - selected phase2 cards that add richer flows
- blocked by:
  - none
- integration notes:
  - this is a hardening and validation slice, not a license to reintroduce per-feature redirect payload formats

## Affected Paths

- `packages/core/src/runtime/auth.ts`
- `packages/core/src/runtime/manifest.ts`
- selected `packages/features/*`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `README.md`

## Interface Notes

- contract changes allowed:
  - yes, only if redirect metadata needs explicit expansion
- store shape changes allowed:
  - yes, in adopting feature state when route recovery outputs become explicit
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for standardized deep-link and recovery semantics

## Verification

- slice gate:
  - protected deep-link, auth recovery, payment return, and share return flows are covered by tests across more than one domain
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which flows are centrally handled and which still require bounded feature-specific extensions

## Acceptance

- [x] deep-link and return-path behavior is verified across multiple business flows
- [x] forced reauth and interrupted-flow recovery remain centralized
- [x] source passthrough semantics stay consistent instead of drifting per feature
- [x] `pnpm verify` run
