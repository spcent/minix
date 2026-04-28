# Card 0466 API Provider URL Helper Normalization

## Summary

Normalize provider base URL handling for upload and share provider-backed asset/link URLs.

## Goal

Reduce provider rollout drift by using shared API provider URL helpers for trimming, validating, fallback behavior, and URL construction.

## Milestone

- milestone file: none
- slice name: `api provider url helper normalization`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add shared provider URL/base URL helpers to the API provider posture module
  - adopt them in upload asset URL and share short-link/poster URL builders
  - add focused tests for invalid configured URLs, trailing slashes, and fallback request URL behavior
- Out of scope:
  - provider credential changes
  - response contract changes
  - provider readiness policy changes

## Ownership

- owned files:
  - `apps/api/src/domains/provider-posture.ts`
  - `apps/api/src/domains/provider-posture.test.ts`
  - `apps/api/src/domains/uploads/pipeline.ts`
  - `apps/api/src/domains/share/attribution.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - committed provider credentials or private callback ids

## Dependencies

- depends on:
  - existing provider posture helpers
- blocked by:
  - none
- integration notes:
  - keep sample/production provider posture semantics unchanged

## Affected Paths

- `apps/api/src/domains/provider-posture.ts`
- `apps/api/src/domains/uploads/pipeline.ts`
- `apps/api/src/domains/share/attribution.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - run `pnpm verify` after all cards in this batch

## Acceptance

- [x] upload and share URL builders reuse provider URL helpers
- [x] invalid configured base URLs fall back to request URLs where applicable
- [x] configured base URLs normalize consistently with trailing slashes
- [x] response field names and posture semantics stay unchanged
- [x] helper behavior is covered by focused tests
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added provider URL helpers for configured base validation, trailing-slash normalization, and fallback URL construction.
- Adopted the helper in upload asset/thumbnail URL generation and share short-link/poster URL generation.
- Kept provider posture summaries and response field names unchanged.

## Verification Notes

- `node --import tsx --test apps/api/src/domains/provider-posture.test.ts`
- `pnpm verify:api`
