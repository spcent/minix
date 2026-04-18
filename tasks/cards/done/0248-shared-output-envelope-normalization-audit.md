# Card 0248 Shared Output Envelope Normalization Audit

## Summary

Audit and normalize the documented shared output envelopes so cross-host consumers read one explicit business shape per domain.

## Goal

Align domain-level outputs such as `session`, `accountSummary`, `notificationList`, `paymentResult`, and `contentAccess` across contracts, backend documentation, and shared controllers.

## Milestone

- milestone file: none
- slice name: `shared output envelope normalization audit`

## Priority

- priority: `P1`

## Scope

- In scope:
  - compare the expanded domain matrix outputs against `docs/BACKEND_CONTRACT.md` and `packages/contracts/src/api/*.ts`
  - identify envelope drift between contracts, API docs, and shared feature-controller expectations
  - normalize naming, recovery metadata, and optional-field posture where one shared output is intended
  - update docs when a field remains intentionally host- or provider-specific
- Out of scope:
  - new product domains or new host families
  - broad controller rewrites unrelated to output-shape normalization

## Ownership

- owned files:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/api/user.ts`
  - `packages/contracts/src/api/settings.ts`
  - `packages/contracts/src/api/message.ts`
  - `packages/contracts/src/api/payment.ts`
  - `packages/contracts/src/api/content.ts`
  - `packages/contracts/src/api/search.ts`
  - `packages/contracts/src/api/upload.ts`
  - `packages/contracts/src/api/share.ts`
  - `packages/contracts/src/api/feedback.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - host-generated manifests or shell artifacts

## Dependencies

- depends on:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `docs/BACKEND_CONTRACT.md`
- blocked by:
  - none
- integration notes:
  - prefer contract and documentation normalization first; only widen into feature-controller edits when a real contract mismatch requires it

## Affected Paths

- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/*.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - yes, when required to normalize a shared output envelope across official hosts
- store shape changes allowed:
  - none unless contract normalization proves a shared controller gap
- controller action changes allowed:
  - limited to field-name or payload-shape alignment driven by contract normalization
- route param changes allowed:
  - none

## Verification

- slice gate:
  - domain outputs named in the completeness matrix map cleanly to documented and typed shared envelopes
- generation needed:
  - none
- final verifier handoff:
  - include the normalized output list and any intentional exceptions left documented

## Acceptance

- [x] matrix outputs are reconciled against backend contract documentation
- [x] shared contract files expose one explicit envelope per intended domain output
- [x] intentional exceptions are documented instead of left implicit
- [x] host-specific drift is reduced without widening product scope
- [x] `pnpm verify` run, or skipped with reason if this remains docs-only

## Implementation Notes

- `docs/BACKEND_CONTRACT.md` now records the canonical domain outputs and their primary typed owners across auth, user, settings, messages, payment, content, search, upload, share, and feedback
- `docs/DOMAIN_COMPLETENESS_MATRIX.md` now uses the same domain-output vocabulary, so the matrix and contract documentation no longer describe different envelope names for the same shared surfaces
- later follow-up work in `0249` to `0255` closed the remaining repo-side drift by aligning shared summary outputs, discover outputs, context envelopes, and governance checks with the normalized envelope posture
- `scripts/check-contract-governance.mjs` now guards the documented response owners so canonical nested outputs cannot silently disappear from the typed contract surface

## Verification Notes

- docs and governance closeout already covered by the current contract baseline and `scripts/check-contract-governance.mjs`
- no additional verifier run was needed for this card-only state sync
