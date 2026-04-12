# Card 0220 Form Protocol Adoption Audit

## Summary

Audit form-surface adoption so the shared form protocol stays the canonical implementation for multi-step, draftable, validated flows.

## Goal

Confirm that official form flows consistently use shared form semantics for validation, draft save, duplicate-submit protection, conditional fields, and approval nodes.

## Milestone

- milestone file: none
- slice name: `form protocol adoption audit`

## Priority

- priority: `P2`

## Scope

- In scope:
  - inventory form flows across auth, account, feedback, managed content, and commerce
  - verify shared form semantics are used instead of host-local field-state forks
  - identify where official hosts need clearer entry points into already-implemented shared forms
- Out of scope:
  - introducing a new form engine or new top-level package

## Ownership

- owned files:
  - `packages/core/src/page-protocols/form.ts`
  - adopting feature packages under `packages/features/*`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local form state machines that bypass the shared form protocol

## Dependencies

- depends on:
  - `0219-detail-protocol-adoption-audit.md`
- blocked by:
  - none
- integration notes:
  - keep changes local and audit-first; do not widen form scope casually

## Affected Paths

- `packages/core/src/page-protocols/form.ts`
- `packages/features/auth/src/**`
- `packages/features/account/src/**`
- `packages/features/feedback/src/**`
- `packages/features/feed/src/**`
- `packages/features/subscription/src/**`
- `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - none unless a concrete shared-form gap is found
- store shape changes allowed:
  - yes, only where an adopting feature misses shared form semantics
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for route recovery alignment

## Verification

- slice gate:
  - official form flows either use the shared protocol or have an explicit documented exception
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if host pages change
- final verifier handoff:
  - include host-by-host form adoption matrix

## Acceptance

- [ ] shared form semantics remain the default for official form flows
- [ ] audit identifies entry-point or adoption gaps concretely
- [ ] host wiring remains manifest- and registry-driven
- [ ] boundaries still match specs
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run
