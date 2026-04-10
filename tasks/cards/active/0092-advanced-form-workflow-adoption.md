# Card 0092 Advanced Form Workflow Adoption

## Summary

Take the new shared form workflow surface beyond feedback and prove step-based, conditional, and workflow-aware form behavior in real business features.

## Goal

Turn `formValues`, `validationErrors`, `submitState`, and workflow metadata from one adopted feature into a reusable cross-feature form foundation.

## Milestone

- milestone file: none
- slice name: `advanced form workflow adoption`

## Priority

- priority: `P2`

## Scope

- In scope:
  - adopt the stronger shared form workflow in at least one additional business feature beyond feedback
  - exercise step keys, conditional fields, dynamic fields, and non-trivial submit phases where the business flow justifies them
  - support bounded draft-save behavior where appropriate
  - keep field-type and validation-rule semantics coherent across features
  - avoid a second form state machine in host-local code
- Out of scope:
  - full BPM/workflow engine
  - rich-text editor implementation

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/form.ts`
  - selected `packages/features/*`
  - optional `apps/api/src/app.ts`
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - host-only forms that bypass the shared form workflow once a shared feature exists

## Dependencies

- depends on:
  - `0080-form-workflow-foundation.md`
  - selected phase2 business cards that need richer forms
- blocked by:
  - none
- integration notes:
  - pick real business flows, not synthetic demos, when adopting advanced form semantics

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/form.ts`
- selected `packages/features/*`
- optional `apps/api/src/app.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, when advanced workflow semantics need refinement
- store shape changes allowed:
  - yes, in form-consuming feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for step-form continuation and draft recovery

## Verification

- slice gate:
  - at least two real feature packages consume the stronger shared form workflow
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which form behaviors are standardized and which remain feature-specific

## Acceptance

- [x] shared form workflow is adopted beyond feedback
- [x] step, conditional, and dynamic-field semantics are proven in a real feature
- [x] draft-save or equivalent non-trivial submit phases are exercised where relevant
- [x] host-local one-off form state does not reappear where a shared form exists
- [x] `pnpm verify` run
