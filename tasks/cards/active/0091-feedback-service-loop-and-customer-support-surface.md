# Card 0091 Feedback Service Loop And Customer Support Surface

## Summary

Expand feedback from ticket creation and status lookup into a fuller service loop with FAQ, customer-service entry, and support process visibility.

## Goal

Move feedback beyond intake-only behavior so users can see a clearer support pathway after submitting a ticket.

## Milestone

- milestone file: none
- slice name: `feedback service loop`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add FAQ or support-hint outputs tied to category and ticket state
  - add clearer customer-service entry behavior on top of the existing category/service metadata
  - expand processing history, progress state, and revisit semantics where needed
  - keep feedback attachments aligned with the upload pipeline rather than duplicating attachment handling
  - align feedback detail surfaces with the stronger form/detail protocols
- Out of scope:
  - full help-center CMS
  - real human support tooling or SLA integrations

## Ownership

- owned files:
  - `packages/contracts/src/api/feedback.ts`
  - `packages/features/feedback/src/**`
  - optional support-related shared feature package if needed
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - host-local support status models that bypass shared feedback contracts

## Dependencies

- depends on:
  - `0077-feedback-ticket-foundation.md`
  - `0085-upload-media-pipeline-productionization.md`
- blocked by:
  - none
- integration notes:
  - feedback remains the source of truth for support-ticket state even if FAQ or customer-service entry surfaces are added

## Affected Paths

- `packages/contracts/src/api/feedback.ts`
- `packages/features/feedback/src/model/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for FAQ/support-entry/service-loop refinement
- store shape changes allowed:
  - yes, in feedback feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for ticket-detail and support-entry navigation

## Verification

- slice gate:
  - submitted feedback can surface more than a static status label and can expose a bounded support loop
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which support-loop steps are sample-backed versus still reserved

## Acceptance

- [ ] feedback surfaces FAQ/support-entry/progress behavior beyond ticket submission alone
- [ ] processing history and revisit behavior are clearer and more actionable
- [ ] upload-backed attachments remain aligned with the shared upload pipeline
- [ ] feedback continues to consume the shared form/detail abstractions
- [ ] `pnpm verify` run
