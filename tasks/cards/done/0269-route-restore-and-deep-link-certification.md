# Card 0269 Route Restore And Deep Link Certification

## Summary

Deepen route-restore and deep-link certification across H5 and WeChat hosts so shared route recovery remains provable under richer flows.

## Goal

Strengthen confidence in route persistence, deep-link handling, and post-auth return without changing manifest-driven host wiring.

## Milestone

- milestone file: none
- slice name: `route restore and deep link certification`

## Priority

- priority: `P2`

## Scope

- In scope:
  - deeper route-restore certification across H5 and WeChat host families
  - stronger deep-link coverage for protected return, discover state, and membership return paths
  - clearer verification expectations for route-writeback and restore-sensitive surfaces
- Out of scope:
  - handwritten duplicate route maps
  - a second router abstraction

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/PRODUCTION_REGRESSION_MATRIX.md`
  - `tests/e2e`
  - `packages/features/*`
  - `apps/host-h5`
  - `apps/host-wechat`
  - `apps/novel-h5`
  - `apps/novel-wechat`
- allowed generated outputs:
  - regenerated host manifests or shells when needed
- forbidden files:
  - manual edits to generated manifest or shell outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0254-verification-and-evidence-automation-hardening.md`
  - `tasks/cards/done/0251-page-protocol-adoption-gap-audit-refresh.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - keep route restore manifest- and registry-driven

## Affected Paths

- `docs/ROADMAP.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`
- `tests/e2e`
- `packages/features/*`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - none unless route certification exposes a missing observable field
- store shape changes allowed:
  - yes, when shared restore state needs clearer metadata
- controller action changes allowed:
  - yes
- route param changes allowed:
  - additive-only inside existing route families

## Verification

- slice gate:
  - route restore and deep-link handling remain explicit and testable across official hosts
- generation needed:
  - host manifests or shells only if changed through source manifests
- final verifier handoff:
  - include new route-recovery coverage and any preserved route-boundary constraints

## Acceptance

- [x] route-restore coverage is deeper across H5 and WeChat hosts
- [x] protected return, discover state, and membership return remain explicit and testable
- [x] manifest-driven host wiring is preserved
- [x] no handwritten duplicate route maps are introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Expanded `tests/e2e/h5-regression-matrix.spec.ts` to cover protected host-h5 deep-link return after sign-in, protected discover deep links with route-bound search state, and a more explicit novel membership return path that keeps reader context.
- Updated the production regression matrix so route-restore and deep-link proof is called out explicitly instead of being implied by broader smoke coverage.
- Preserved existing manifest- and registry-driven host routing; no handwritten route maps or host-local restore wrappers were introduced.

## Verification Notes

- `pnpm verify`
- Route certification coverage added in `tests/e2e/h5-regression-matrix.spec.ts` for the H5 host pair.
