# Card 0077 Feedback Ticket Foundation

## Summary

Introduce a shared feedback domain for issue reports, complaints, suggestions, and screenshots so future support flows can reuse one ticket model.

## Goal

Create stable outputs for `feedbackTicket`, `feedbackCategory`, and `feedbackStatus`, including basic context capture fields that can be populated from the shared kernel and platform adapters.

## Milestone

- milestone file: none
- slice name: `feedback ticket foundation`

## Scope

- In scope:
  - add contracts for `feedbackTicket`, `feedbackCategory`, and `feedbackStatus`
  - cover feedback types such as issue report, suggestion, complaint, report/abuse, and satisfaction survey
  - cover service-loop fields such as FAQ entry, ticket state, customer-service entry, handling progress, revisit flag, and processing history
  - cover context capture for source page, user id, device info, version, and screenshot/attachment references
  - cover operations fields such as labels, priority, revisit requirement, and processing records
  - create a feature package for feedback form state and submission workflow
  - use existing shared form/detail protocols where they fit instead of inventing a parallel feature shape
  - add sample API routes for feedback submission and retrieval
- Out of scope:
  - full customer-service workflow
  - moderation back office
  - real file storage for screenshots beyond sample references

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/core/src/page-protocols/form.ts`
  - new feedback feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests and page definitions
  - affected tests
- allowed generated outputs:
  - generated manifests and shells when host pages are added
- forbidden files:
  - unrelated auth and payment domain files

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
  - `0076-upload-share-foundation.md`
- blocked by:
  - none
- integration notes:
  - feedback attachments should reference upload results rather than creating a second attachment pipeline

## Affected Paths

- `packages/core/src/page-protocols/form.ts`
- selected `packages/contracts/src/api/**`
- new feedback feature package under `packages/features/*`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, add feedback contracts
- store shape changes allowed:
  - yes, in the new feedback feature only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for feedback source-page context if needed

## Verification

- slice gate:
  - feedback form state, submission result, and status retrieval compile through shared contracts and pass tests
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record the final ticket payload fields and which context values are captured automatically
  - record how feedback attachments align with upload-domain outputs

## Acceptance

- [ ] shared feedback contracts cover ticket creation, category, status, and context capture
- [ ] shared feedback contracts cover FAQ/service-loop/priority/processing-history fields explicitly
- [ ] feedback feature reuses shared form-oriented patterns instead of inventing a host-only flow
- [ ] attachment references align with upload-domain outputs
- [ ] `pnpm verify` run
