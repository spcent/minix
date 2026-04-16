# Card 0252 Cross-domain Context Envelope Audit

## Summary

Audit the shared context envelopes carried through messages, share, upload, and feedback so route, actor, and asset metadata stay portable across domains.

## Goal

Prevent these context-heavy domains from drifting into incompatible envelope shapes that would force host-specific adapters or duplicate coordination logic later.

## Milestone

- milestone file: none
- slice name: `cross-domain context envelope audit`

## Priority

- priority: `P2`

## Scope

- In scope:
  - compare how message, share, upload, and feedback contracts carry route context, actor identifiers, asset metadata, and source-page information
  - identify duplicated or conflicting envelope shapes between API contracts and shared feature controllers
  - normalize shared context fields where one cross-domain envelope is intended
  - document justified exceptions when a domain truly needs additional provider or moderation metadata
- Out of scope:
  - adding new cross-domain aggregator packages
  - changing provider rollout posture already tracked by `0241` through `0246`

## Ownership

- owned files:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/message.ts`
  - `packages/contracts/src/api/share.ts`
  - `packages/contracts/src/api/upload.ts`
  - `packages/contracts/src/api/feedback.ts`
  - `packages/features/messages/src/controller/index.ts`
  - `packages/features/media-tools/src/controller/index.ts`
  - `packages/features/feedback/src/controller/index.ts`
  - `apps/api/src/domains/messages/routes.ts`
  - `apps/api/src/domains/share/routes.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - `apps/api/src/domains/feedback/routes.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - host-only adapters that paper over a shared context-shape mismatch

## Dependencies

- depends on:
  - `tasks/cards/active/0248-shared-output-envelope-normalization-audit.md`
- blocked by:
  - none
- integration notes:
  - prefer one shared context-envelope vocabulary across these domains; extra provider fields should extend that envelope rather than replace it

## Affected Paths

- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/message.ts`
- `packages/contracts/src/api/share.ts`
- `packages/contracts/src/api/upload.ts`
- `packages/contracts/src/api/feedback.ts`
- `packages/features/messages/src/controller/index.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/share/routes.ts`
- `apps/api/src/domains/uploads/routes.ts`
- `apps/api/src/domains/feedback/routes.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for shared context-envelope normalization
- store shape changes allowed:
  - limited to context metadata carried by shared controllers
- controller action changes allowed:
  - yes, when needed to align context capture or transport
- route param changes allowed:
  - limited to preserving existing source-route metadata, not creating new route families

## Verification

- slice gate:
  - cross-domain context fields used by messages, share, upload, and feedback are explicit, portable, and documented
- generation needed:
  - none
- final verifier handoff:
  - include the normalized context fields and any intentional domain-specific extensions

## Acceptance

- [ ] message, share, upload, and feedback context envelopes are audited against one shared vocabulary
- [ ] duplicated or conflicting context fields are normalized or documented
- [ ] provider-specific extensions do not replace the shared context envelope
- [ ] host-level adapter drift is avoided by shared contract alignment
- [ ] `pnpm verify` run, or skipped with reason if this remains docs-only
