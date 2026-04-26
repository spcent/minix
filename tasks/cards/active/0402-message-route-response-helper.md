# Card 0402 Message Route Response Helper

## Summary

Centralize message route unread-badge response enrichment.

## Goal

Remove repeated route-local `response.unreadBadge = ...` mutation from message endpoints so inbox, thread detail, send, retry, and sync responses stay consistent as the message surface expands.

## Milestone

- milestone file: none
- slice name: `message route response helper`

## Priority

- priority: `P3`

## Scope

- In scope:
  - API-domain helper for attaching unread badge to mutable message route responses
  - adoption in message route handlers
  - targeted API message tests/typecheck
- Out of scope:
  - changing message contract output shape
  - changing notification unread semantics
  - adding new message endpoints

## Ownership

- owned files:
  - `apps/api/src/domains/messages/routes.ts`
  - optional message-domain helper files
  - existing API tests if behavior needs explicit coverage
- allowed generated outputs:
  - none
- forbidden files:
  - shared package contracts unless behavior changes

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Keep the helper inside the messages domain; it depends on message-specific unread badge semantics.

## Affected Paths

- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/messages/*`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
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
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - unread badge remains present on list, detail, create, read, send, retry, and sync responses.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
