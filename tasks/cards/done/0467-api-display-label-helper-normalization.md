# Card 0467 API Display Label Helper Normalization

## Summary

Consolidate repeated API display-label formatting for snake/underscore tokens and title labels.

## Goal

Make provider, notification, payment, and support copy clearer and reusable across product matrices by using one formatting helper instead of scattered ad hoc string replacement.

## Milestone

- milestone file: none
- slice name: `api display label helper normalization`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add shared API domain text helpers for lower-case token labels and title-case token labels
  - replace selected repeated `replace("_", " ")`, `replaceAll("_", " ")`, and first-letter capitalization sites
  - add focused tests for multi-underscore, hyphen, whitespace, and fallback behavior
- Out of scope:
  - contract or response shape changes
  - copy rewrites unrelated to token formatting
  - frontend render changes

## Ownership

- owned files:
  - `apps/api/src/domains/text.ts`
  - `apps/api/src/domains/text.test.ts`
  - selected API domain files with repeated token-label formatting
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests, registries, or WeChat shell outputs

## Dependencies

- depends on:
  - existing API response copy fields
- blocked by:
  - none
- integration notes:
  - preserve existing semantic text; only normalize token label construction

## Affected Paths

- `apps/api/src/domains/messages/*`
- `apps/api/src/domains/settings/*`
- `apps/api/src/domains/payment/*`
- `apps/api/src/domains/feedback/*`

## Related Specs

- `docs/BACKEND_CONTRACT.md`

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

- [x] repeated API token-label formatting uses a shared helper where practical
- [x] multi-underscore labels are normalized consistently
- [x] helper behavior is covered by focused tests
- [x] response fields and business semantics stay unchanged
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added shared API text helpers for lower-case token labels and title-case token labels.
- Adopted the helpers in notification touchpoints, message threads, notification badges, settings channel status, payment channel execution copy, and feedback ticket action labels.
- Normalized multi-underscore and hyphen token labels without changing response field names.

## Verification Notes

- `node --import tsx --test apps/api/src/domains/text.test.ts`
- `pnpm verify:api`
