# API Seed Snapshot Helper Adoption

Status: active

## Summary

Adopt API-domain snapshot helpers for default seed state cloning in the API data module.

## Ownership

- owned files: `apps/api/src/data.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] API seed data uses the same snapshot helper convention as API domains
- [ ] default sample state remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
