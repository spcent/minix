# Feedback Support Context Snapshot Adoption

Status: active

## Summary

Clone optional feedback context when creating support threads and upload bindings.

## Goal

Feedback support handoff and upload attachment ownership should use consistent immutable context snapshots.

## Scope

- In scope:
  - refactor support-thread context forwarding in `apps/api/src/domains/feedback/support.ts`
  - refactor feedback upload binding context forwarding in `apps/api/src/domains/feedback/tickets.ts`
  - preserve support thread and upload binding behavior
- Out of scope:
  - changing message thread behavior
  - changing upload pipeline behavior

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/support.ts`
  - `apps/api/src/domains/feedback/tickets.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] support thread creation receives cloned optional contexts
- [ ] upload binding receives cloned optional contexts
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
