# Card 0255 Shared Contract Governance Hardening

## Summary

Harden governance around the existing shared contracts so canonical domain outputs and explicit protocol exceptions remain stable as the repo evolves.

## Goal

Prevent shared contracts from drifting into incompatible host-local variants or undocumented additive growth.

## Milestone

- milestone file: none
- slice name: `shared contract governance hardening`

## Priority

- priority: `P1`

## Scope

- In scope:
  - improve guardrails around canonical domain output envelopes
  - tighten compatibility expectations for additive response fields
  - document and enforce explicit protocol exceptions such as account/settings summary workspaces and reader/runtime exceptions
  - improve checks that catch contract drift earlier
- Out of scope:
  - redesigning the current domain model from scratch
  - introducing a second contract system or parallel schema registry

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `packages/contracts`
  - `scripts`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local compatibility wrappers used instead of fixing a shared contract drift

## Dependencies

- depends on:
  - `tasks/cards/active/0248-shared-output-envelope-normalization-audit.md`
  - `tasks/cards/active/0251-page-protocol-adoption-gap-audit-refresh.md`
  - `tasks/cards/active/0252-cross-domain-context-envelope-audit.md`
- blocked by:
  - none
- integration notes:
  - prefer additive guardrails and documentation over broad contract churn

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/contracts`
- `scripts`

## Related Specs

- `specs/repo.yaml`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, when tightening compatibility or clarifying canonical ownership
- store shape changes allowed:
  - limited to explicit protocol exception documentation and normalization support
- controller action changes allowed:
  - limited to aligning with clarified contract rules
- route param changes allowed:
  - no, unless a contract-governance gap proves one is missing

## Verification

- slice gate:
  - canonical outputs, additive compatibility, and explicit protocol exceptions are easier to reason about and harder to drift
- generation needed:
  - none
- final verifier handoff:
  - include any new governance checks and the documented compatibility rules

## Acceptance

- [ ] shared envelope ownership is clearer and easier to verify
- [ ] additive contract growth has a documented compatibility posture
- [ ] explicit protocol exceptions remain documented instead of drifting into code-only behavior
- [ ] no new parallel contract system or host-local compatibility layer is introduced
- [ ] `pnpm verify` run, or skipped with reason if this remains docs-only
