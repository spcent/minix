# Provider Posture Contract Normalization

Status: done

## Summary

Normalize shared provider posture primitives in contracts so upload, share, and future provider-backed domains reuse the same provider-mode and secret-material vocabulary.

## Goal

Provider-backed product capabilities should expose a consistent base posture without duplicating foundational fields in each API contract.

The reusable base should cover:

- sample vs production provider mode
- explicit tracked-source secret posture
- optional secret-material summary for release evidence
- domain-specific providers, hosts, and readiness summaries remaining in each API contract

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: provider posture reuse

## Scope

- In scope:
  - add shared provider posture types under `packages/contracts/src/kernel/capability.ts`
  - make upload/share provider posture interfaces extend the shared base
  - update kernel contract tests to keep the shared vocabulary visible
  - update docs/task card with completion notes
- Out of scope:
  - changing runtime provider behavior
  - adding live provider credentials
  - modifying generated host files

## Ownership

- owned files:
  - `packages/contracts/src/kernel/capability.ts`
  - `packages/contracts/src/kernel/index.test.ts`
  - `packages/contracts/src/api/upload.ts`
  - `packages/contracts/src/api/share.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - `apps/*/src/render/page-registry.ts`
  - `apps/host-wechat/miniprogram/**`

## Dependencies

- depends on: `0284-product-matrix-reuse-playbook`
- blocked by: none
- integration notes: keep API output fields backwards compatible; this is a type-level normalization, not a response-shape rename.

## Affected Paths

- `packages/contracts/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `specs/dependency-rules.yaml`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed: additive shared type only
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: `pnpm typecheck` and `pnpm test`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] upload and share provider posture use the same provider-mode and secret-material base vocabulary
- [x] response field names stay backwards compatible
- [x] kernel test covers the shared provider-mode constants
- [x] docs identify provider posture normalization as the first reusable primitive from the audit
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added shared `PROVIDER_POSTURE_MODES`, `ProviderPostureMode`, `SecretMaterialPosture`, and `ProviderPostureBase` under contracts kernel capability vocabulary.
- Updated upload and share provider posture contracts to extend the shared base without renaming response fields.
- Added kernel test coverage for the provider posture mode constants.
- Ran `pnpm typecheck` and `pnpm test`; both passed before final full verification.
