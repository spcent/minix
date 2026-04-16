# Card 0249 User And Settings Summary Alignment

## Summary

Align shared account and settings summaries so the four official hosts project one consistent user and preference model.

## Goal

Keep `userProfile`, `accountSummary`, `userStatus`, `preferences`, `featureToggles`, and `privacyOptions` stable across contracts, feature controllers, and host-visible account or settings surfaces.

## Milestone

- milestone file: none
- slice name: `user and settings summary alignment`

## Priority

- priority: `P1`

## Scope

- In scope:
  - audit `user` and `settings` contract shapes against current shared feature outputs
  - align account-center and settings-center summaries where hosts currently project the same information through slightly different shapes
  - preserve host-specific presentation while collapsing shared data drift
  - update docs for any intentionally embedded user-asset or debug-summary exceptions
- Out of scope:
  - new user-detail routes
  - broad redesign of account or settings host pages

## Ownership

- owned files:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/user.ts`
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/account/src/controller/index.ts`
  - `packages/features/account/src/model/index.ts`
  - `packages/features/settings/src/controller/index.ts`
  - `packages/features/settings/src/model/index.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifest or shell outputs unless a host route definition truly changes

## Dependencies

- depends on:
  - `tasks/cards/active/0248-shared-output-envelope-normalization-audit.md`
- blocked by:
  - none
- integration notes:
  - prefer shared summary normalization inside contracts and feature controllers; host apps should only adapt presentation and local labels

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/contracts/src/api/settings.ts`
- `packages/features/account/src/controller/index.ts`
- `packages/features/account/src/model/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `packages/features/settings/src/model/index.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for summary-shape alignment across official hosts
- store shape changes allowed:
  - limited to shared account or settings summaries
- controller action changes allowed:
  - yes, when needed to normalize returned summary payloads
- route param changes allowed:
  - none

## Verification

- slice gate:
  - user and settings summaries read as one shared model across contracts, controllers, and host surfaces
- generation needed:
  - none unless a host source manifest changes intentionally
- final verifier handoff:
  - include the before or after summary alignment notes and any intentional exceptions

## Acceptance

- [ ] `user` and `settings` shared summary shapes are aligned
- [ ] account and settings feature controllers return one stable payload posture
- [ ] host-local display differences do not create contract drift
- [ ] docs are updated for any embedded or intentionally local exceptions
- [ ] `pnpm verify:feature account` and `pnpm verify:feature settings` run, or skipped with reason if docs-only
