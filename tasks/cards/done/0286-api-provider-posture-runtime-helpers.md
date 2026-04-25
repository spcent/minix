# API Provider Posture Runtime Helpers

Status: done

## Summary

Consolidate repeated API provider-mode, provider-name, base-url, host, and secret-material posture helpers so provider-backed domains can reuse one runtime vocabulary.

## Goal

Upload, share, and future provider-backed product capabilities should resolve sample/production mode and provider posture text through shared API-domain helpers instead of repeating the same conditional logic in each domain.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: API provider posture reuse

## Scope

- In scope:
  - add an API-domain helper for provider posture runtime decisions
  - migrate upload/share provider posture code to the helper
  - keep response shapes and existing provider env names unchanged
  - update the product-matrix reuse playbook with the API helper recommendation
- Out of scope:
  - changing auth, payment, or message provider behavior in this card
  - adding live provider credentials
  - changing external env variable names

## Ownership

- owned files:
  - `apps/api/src/domains/provider-posture.ts`
  - `apps/api/src/domains/uploads/pipeline.ts`
  - `apps/api/src/domains/share/attribution.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - `apps/api/src/app.ts`
  - `apps/api/src/app-composition.ts`
  - generated host files

## Dependencies

- depends on: `0285-provider-posture-contract-normalization`
- blocked by: none
- integration notes: helper must stay in API domain code and must not pull platform or host dependencies into contracts/features.

## Affected Paths

- `apps/api/src/domains/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed: none
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: `pnpm verify:api`
- generation needed: no
- final verifier handoff: `pnpm verify` after the last card in this batch

## Acceptance

- [x] upload/share provider-mode resolution uses shared API helper vocabulary
- [x] provider names still honor configured env values before defaults
- [x] provider posture summaries still state that secret material is not tracked in source
- [x] response shapes remain backwards compatible
- [x] playbook records the helper as the API-side provider posture reuse point
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `apps/api/src/domains/provider-posture.ts` as the API-side provider posture helper.
- Migrated upload/share provider-mode resolution, configured-provider fallback, URL host extraction, base URL normalization, and secret-material summary copy to the shared helper.
- Kept all upload/share response fields and env variable names unchanged.
