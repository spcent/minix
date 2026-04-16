# Card 0251 Page Protocol Adoption Gap Audit Refresh

## Summary

Refresh the list, detail, and form protocol adoption audit after the expanded domain matrix clarified more shared workflow expectations.

## Goal

Keep page-protocol usage explicit and prevent feature-local flags from quietly replacing shared list, detail, or form state semantics.

## Milestone

- milestone file: none
- slice name: `page protocol adoption gap audit refresh`

## Priority

- priority: `P2`

## Scope

- In scope:
  - re-audit direct and embedded `ListPageState`, `DetailPageState`, and `FormPageState` usage across feature packages
  - check whether any recently expanded domain workflow is drifting into feature-local status flags
  - update protocol-audit notes and identify any new explicit exceptions
  - propose follow-up slices only when a real adoption gap exists
- Out of scope:
  - rewriting stable feature controllers without a demonstrated protocol gap
  - broad runtime-protocol redesign

## Ownership

- owned files:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - `packages/core/src/page-protocols/form.ts`
  - affected `packages/features/*` controllers or models only when the audit proves a gap
- allowed generated outputs:
  - none
- forbidden files:
  - unrelated host apps unless a proven protocol gap requires host-surface clarification

## Dependencies

- depends on:
  - `tasks/cards/active/0248-shared-output-envelope-normalization-audit.md`
  - `tasks/cards/active/0249-user-and-settings-summary-alignment.md`
  - `tasks/cards/active/0250-content-search-and-discover-output-alignment.md`
- blocked by:
  - none
- integration notes:
  - this is an audit-first slice; prefer documenting explicit exceptions over speculative refactors

## Affected Paths

- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/core/src/page-protocols/list.ts`
- `packages/core/src/page-protocols/detail.ts`
- `packages/core/src/page-protocols/form.ts`
- `packages/features/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - none unless a verified protocol gap requires a documented shared status field
- store shape changes allowed:
  - limited to shared page-state structures
- controller action changes allowed:
  - yes, only when replacing drifted local flags with existing shared protocol semantics
- route param changes allowed:
  - none

## Verification

- slice gate:
  - the protocol-adoption audit is current enough to show where shared list, detail, and form semantics are authoritative and where explicit exceptions remain
- generation needed:
  - none
- final verifier handoff:
  - include refreshed audit notes and any new follow-up cards created from real gaps

## Acceptance

- [ ] list, detail, and form protocol adoption notes are refreshed
- [ ] newly observed local-flag drift is either corrected or documented as an explicit exception
- [ ] no speculative protocol redesign is folded into the audit
- [ ] follow-up work is proposed only for verified gaps
- [ ] `pnpm verify` run, or skipped with reason if this remains docs-only
