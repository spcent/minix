# Media Tools Provider Mode Boundary Cleanup

Status: active

## Summary

Clarify media-tools provider-mode checks without crossing feature/API package boundaries.

## Scope

- In scope: upload/share provider summary predicates and inferred provider-mode checks.
- Out of scope: upload/share contracts, platform adapters, capability execution.

## Ownership

- owned files: `packages/features/media-tools/src/controller/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:feature media-tools`
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] media-tools provider-mode checks are centralized in narrow local helpers
- [ ] feature package does not import API provider helpers
- [ ] public state shape remains unchanged
- [ ] playbook records media-tools boundary guidance
- [ ] `pnpm verify` run, or skipped with reason if docs-only
