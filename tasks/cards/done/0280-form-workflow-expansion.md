# Card 0280 Form Workflow Expansion

## Summary

Expand shared form workflow support for upload-backed fields, drafts, duplicate protection, dynamic fields, and approval templates.

## Goal

Keep registration completion, consultation, feedback, content publishing, and account operation forms aligned on `formValues`, `validationErrors`, and `submitState`.

## Milestone

- milestone file: none
- slice name: `form workflow expansion`

## Priority

- priority: `P3`

## Scope

- In scope:
  - upload-backed field workflows
  - draft recovery policies and submission keys
  - approval node templates and conditional field behavior
  - async validation summaries and duplicate-submit evidence
- Out of scope:
  - ad hoc duplicate-submit flags outside `FormSubmitState`
  - replacing provider-aware auth flows with generic-only forms
  - host-only form state

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/form.ts`
  - `packages/features/feedback`
  - `packages/features/feed`
  - `packages/features/account`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - none unless host manifests change
- forbidden files:
  - manual generated output edits

## Dependencies

- depends on:
  - `tasks/cards/done/0220-form-protocol-adoption-audit.md`
  - `tasks/cards/done/0109-form-platform-and-approval-workflow.md`
- blocked by:
  - product decisions for approval templates and draft retention
- integration notes:
  - auth can stay provider-aware by design; generic form protocol should not erase auth-specific provider semantics

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/form.ts`
- `packages/features/feedback`
- `packages/features/feed`
- `packages/features/account`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in form adopters
- controller action changes allowed:
  - yes, for form workflow actions
- route param changes allowed:
  - none unless draft or result routing is explicitly manifest-owned

## Verification

- slice gate:
  - targeted feature verification for each form adopter changed
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include draft, submit, duplicate-blocked, validation-error, dynamic-field, and approval examples

## Implementation Notes

- Added upload field workflow descriptors, draft policy, approval templates, async validation summaries, and duplicate-submit evidence to the shared form contract.
- Extended `createFormWorkflowState` to derive upload-backed field keys from schema definitions while keeping dynamic and conditional fields schema-driven.
- Kept duplicate submit handling inside `FormSubmitState`, including evidence for blocked submissions.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the expanded form workflow posture.

## Verification Notes

- Ran `pnpm verify`.

## Acceptance

- [x] form outputs remain `formValues`, `validationErrors`, and `submitState`
- [x] duplicate protection uses `FormSubmitState`
- [x] upload-backed fields reuse upload references instead of local wrappers
- [x] dynamic and conditional fields remain schema-driven
- [x] docs updated for workflow changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
