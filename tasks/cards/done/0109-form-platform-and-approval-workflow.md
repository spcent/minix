# Card 0109 Form Platform And Approval Workflow

## Summary

Generalize form workflow support into a reusable platform for dynamic fields, steps, drafts, approvals, and conditional display.

## Goal

Move beyond account/feedback-specific form adoption and support reusable business forms for registration completion, appointment, payment confirmation, content publishing, and feedback.

## Milestone

- milestone file: none
- slice name: `form platform and approval workflow`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add schema-driven field definitions and validation result contracts
  - support dynamic fields, conditional visibility, step transitions, drafts, and duplicate-submit protection
  - add approval workflow primitives with node state and assignee/status metadata
  - adopt the form platform in at least one non-account feature beyond feedback
  - add tests for dynamic schema rendering data and approval progression
- Out of scope:
  - building a visual form designer

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/form.ts`
  - `packages/features/account/src/**`
  - `packages/features/feedback/src/**`
  - additional adopting feature packages
  - `apps/api/src/app.ts`
  - form tests
- allowed generated outputs:
  - none unless pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0092-advanced-form-workflow-adoption.md`
  - `0103-content-cms-authoring-and-review-console.md`
- blocked by:
  - none
- integration notes:
  - keep cross-feature abstractions in contracts/core, not a catch-all feature package

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/form.ts`
- `packages/features/account/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for field schema, validation, workflow, approval, draft, and submit result semantics
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for form id, step id, draft id, and return target

## Verification

- slice gate:
  - one additional business feature uses the shared form platform without custom-only workflow state
- generation needed:
  - none unless new pages are added
- final verifier handoff:
  - document adopted features and unsupported field types

## Acceptance

- [x] schema-driven fields cover text, number, date, single/multi select, upload, and rich-text placeholder
- [x] conditional fields and steps are data-driven
- [x] drafts restore across route/session recovery
- [x] approval state has node and assignee metadata
- [x] duplicate-submit protection is centralized
- [x] `pnpm verify` run
