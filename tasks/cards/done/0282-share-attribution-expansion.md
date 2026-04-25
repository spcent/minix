# Card 0282 Share Attribution Expansion

## Summary

Expand share provider readiness, short-link, poster, campaign attribution, invite binding, and conversion reporting through existing share contracts.

## Goal

Keep page, content, invite, and poster sharing aligned on `sharePayload`, `shareChannel`, and `shareAttribution` without host-local attribution wrappers.

## Milestone

- milestone file: none
- slice name: `share attribution expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - production short-link and poster adapter metadata
  - campaign attribution rules and channel markers
  - invite binding and return recognition reports
  - conversion evidence and replay summaries
- Out of scope:
  - committed short-link or poster provider secrets
  - route maps recreated in host apps
  - share wrappers outside media-tools and share domain ownership

## Ownership

- owned files:
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools`
  - `apps/api/src/domains/share`
  - `apps/api/src/domains/public/routes.ts`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - provider secrets, manual generated output edits

## Dependencies

- depends on:
  - `tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`
  - `tasks/cards/done/0265-share-channel-readiness-and-attribution-hardening.md`
- blocked by:
  - selected short-link and poster providers for provider-specific metadata
- integration notes:
  - keep landing and return targets aligned with auth redirect target contracts

## Affected Paths

- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools`
- `apps/api/src/domains/share`
- `apps/api/src/domains/public/routes.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in media-tools state
- controller action changes allowed:
  - yes, within existing share actions
- route param changes allowed:
  - additive-only for landing, return, and attribution markers

## Verification

- slice gate:
  - `pnpm verify:feature media-tools`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include prepare, dispatch, resolve, return, report, poster, short-link, invite, and conversion examples

## Implementation Notes

- Added share provider posture, campaign attribution rules, and conversion evidence to the shared share contract.
- Derived provider posture and campaign/conversion metadata in the share API while keeping landing and return targets inside the existing route-aligned envelopes.
- Surfaced provider posture in media-tools state without adding host-local attribution wrappers.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the expanded share attribution posture.

## Verification Notes

- Ran `pnpm verify:feature media-tools`.
- Ran `pnpm test`.

## Acceptance

- [x] share outputs remain `sharePayload`, `shareChannel`, and `shareAttribution`
- [x] landing and return targets stay route-contract aligned
- [x] provider readiness is visible without committing secrets
- [x] host apps do not recreate attribution wrappers
- [x] docs updated for provider or attribution workflow changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
