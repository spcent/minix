# Card 0449 API SVG Text Escaping

## Summary

Centralize API SVG XML text escaping.

## Goal

Replace ad hoc SVG text escaping with a shared HTTP helper so generated API SVGs render user-facing text accurately and safely.

## Milestone

- milestone file: none
- slice name: `api svg text escaping`

## Priority

- priority: `P2`

## Scope

- In scope:
  - expose shared XML escaping for API SVG responses
  - reuse it in sample asset SVG rendering
  - use it for upload thumbnail SVG file names instead of URL encoding
  - focused API/typecheck verification
- Out of scope:
  - visual redesign of generated SVG assets
  - storage or upload pipeline behavior changes
  - request/response contract changes

## Ownership

- owned files:
  - `apps/api/src/http/response.ts`
  - `apps/api/src/response.test.ts`
  - `apps/api/src/sample-assets.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - `tasks/cards/active/0449-api-svg-text-escaping.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Keep existing SVG response headers and cache behavior unchanged.

## Affected Paths

- `apps/api/src/http/response.ts`
- `apps/api/src/sample-assets.ts`
- `apps/api/src/domains/uploads/routes.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm typecheck`
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - Upload thumbnail SVG text should show readable filenames while escaping XML metacharacters.

## Implementation Notes

- Added shared `escapeXml` in API HTTP response helpers.
- Reused the helper in sample asset SVG rendering.
- Replaced upload thumbnail filename URL encoding with XML text escaping so rendered filenames remain readable.
- Added a focused API test for XML metacharacter escaping.

## Verification Notes

- Ran `pnpm typecheck`.
- Ran `pnpm verify:api`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
