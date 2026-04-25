# Provider Mode Helper Adoption

## Summary

Extend the API provider posture helper beyond upload/share so auth and message touchpoint provider-mode entry points use the same sample/production resolver.

## Goal

Provider-backed domains should avoid hand-written `env === "production" ? "production" : "sample"` branches at their runtime boundary. New product matrices can then follow one provider-mode convention for login, messages, upload, and share.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: provider mode helper adoption

## Scope

- In scope:
  - migrate auth SMS/OAuth provider mode resolution to `resolveProviderPostureMode`
  - migrate message touchpoint provider mode resolution to `resolveProviderPostureMode`
  - update the reuse playbook with the broader provider helper rule
- Out of scope:
  - changing provider readiness behavior
  - changing payment commerce provider posture in this card
  - changing env variable names or response shapes

## Ownership

- owned files:
  - `apps/api/src/domains/auth/routes.ts`
  - `apps/api/src/domains/settings/state.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0286-api-provider-posture-runtime-helpers`
- blocked by: none
- integration notes: keep helper adoption behavior-preserving; only centralize sample/production normalization.

## Affected Paths

- `apps/api/src/domains/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`

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

- [ ] auth SMS/OAuth provider modes use the shared API helper
- [ ] message touchpoint provider mode uses the shared API helper
- [ ] env names and response shapes stay unchanged
- [ ] playbook explains the provider-mode helper as a cross-domain rule
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
