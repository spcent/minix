# Card 0080 Form Workflow Foundation

## Summary

Turn the current form protocol scaffold into a real shared form workflow surface that can support registration, profile completion, consultation booking, payment confirmation, content submission, and feedback submission.

## Goal

Provide stable shared outputs for `formValues`, `validationErrors`, and `submitState` so form-based business features can be added without re-inventing validation and submission semantics.

## Milestone

- milestone file: none
- slice name: `form workflow foundation`

## Scope

- In scope:
  - normalize shared form outputs for `formValues`, `validationErrors`, and `submitState`
  - cover field types such as text, number, date, single select, multi select, upload reference, and reserved rich-text fields
  - cover validation rules such as required, length, format, cross-field validation, and async validation
  - cover submission workflow semantics such as draft save, final submit, duplicate-submit protection, and submit-result state
  - cover business flow semantics such as step forms, approval-flow forms, dynamic fields, and conditional visibility
  - align feedback and later auth/profile forms to the shared workflow instead of host-local one-offs
- Out of scope:
  - shipping all business forms at once
  - rich-text editor implementation
  - full workflow engine or approval service

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/form.ts`
  - new or updated feature packages that adopt the form workflow
  - selected `apps/api/src/app.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source manifests change
- forbidden files:
  - direct edits to generated host outputs

## Dependencies

- depends on:
  - `0069-auth-identity-contract-hardening.md`
  - `0076-upload-share-foundation.md`
  - `0077-feedback-ticket-foundation.md`
- blocked by:
  - none
- integration notes:
  - keep form workflow generic enough to serve feedback/auth/content forms without turning into a god-object feature

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/form.ts`
- selected `packages/features/*`
- selected `apps/api/src/app.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, refine shared form submission and field-error contracts
- store shape changes allowed:
  - yes, in form-oriented feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for step-form and return-path semantics where needed

## Verification

- slice gate:
  - at least one real feature package uses the stronger form workflow contract instead of only the raw protocol scaffold
- generation needed:
  - run generation only if host manifest sources change
- final verifier handoff:
  - record which form behaviors are now standardized and which remain domain-specific extensions

## Acceptance

- [x] form contracts cover field type, validation, and submission workflow semantics explicitly
- [x] at least one business feature consumes the shared form workflow
- [x] outputs include explicit `formValues`, `validationErrors`, and `submitState` semantics
- [x] `pnpm verify` run
