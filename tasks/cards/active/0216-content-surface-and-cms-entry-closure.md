# Card 0216 Content Surface And CMS Entry Closure

## Summary

Close the gap between the implemented content domain and the official host entry surfaces for both content consumption and managed-content operations.

## Goal

Make the content domain deliberately reachable on official hosts instead of being split implicitly across discover and novel-only flows.

## Milestone

- milestone file: none
- slice name: `content surface and cms entry closure`

## Priority

- priority: `P1`

## Scope

- In scope:
  - map content-consumption and managed-content entry points across official hosts
  - add any missing manifest-driven routes needed for bounded content discovery or content-management entry
  - clarify where managed content lives versus novel-specific reading content
  - keep content lifecycle and CMS actions inside existing shared feature boundaries
- Out of scope:
  - replacing the novel sample with a universal content renderer

## Ownership

- owned files:
  - `packages/contracts/src/api/content.ts`
  - `packages/features/feed/src/**`
  - `packages/features/catalog/src/**`
  - `packages/features/novel-detail/src/**`
  - `apps/api/src/domains/content/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - handwritten edits to generated host outputs

## Dependencies

- depends on:
  - `0217-search-center-host-adoption.md`
- blocked by:
  - final decision on whether official managed-content entry should live inside discover or a dedicated page
- integration notes:
  - keep novel-specific extensions explicit instead of collapsing content into one generic host page by force

## Affected Paths

- `packages/contracts/src/api/content.ts`
- `packages/features/feed/src/controller/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `apps/api/src/domains/content/routes.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for bounded host-entry metadata if needed
- store shape changes allowed:
  - yes, in feed/catalog/content-related state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for content-selection and source-return semantics

## Verification

- slice gate:
  - content discovery and managed-content entry are intentionally routed on the agreed official hosts
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record host-by-host content entry matrix and CMS entry decision

## Acceptance

- [ ] official hosts expose deliberate content entry points instead of accidental scattered access
- [ ] managed-content lifecycle flows remain shared and manifest-driven
- [ ] novel-specific content continues to sit on an explicit extension layer
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added the shared `feed` page to `host-wechat`, which closes the accidental H5-only gap for the discover/content-search surface
- 2026-04-12: remaining scope is the CMS-entry decision and novel-host parity, not base host-wechat adoption
