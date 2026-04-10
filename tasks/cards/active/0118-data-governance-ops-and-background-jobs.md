# Card 0118 Data Governance Ops And Background Jobs

## Summary

Replace in-memory/sample operational assumptions with durable data governance, background jobs, audit, and monitoring hooks.

## Goal

Support production persistence, migrations, cleanup jobs, reconciliation jobs, retry queues, monitoring events, and administrative audit trails.

## Milestone

- milestone file: none
- slice name: `data governance ops and background jobs`

## Priority

- priority: `P2`

## Scope

- In scope:
  - define durable store schemas for sessions, credentials, orders, uploads, messages, content, feedback, and audit events
  - add migration/backfill strategy for new store records
  - add background job records for upload cleanup, payment reconciliation, notification retry, and cancellation expiry
  - add monitoring/logging hooks for failed jobs and suspicious operations
  - add tests for durable persistence and job idempotency
- Out of scope:
  - external observability vendor setup unless required by deployment target

## Ownership

- owned files:
  - `apps/api/src/store*.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `docs/BACKEND_CONTRACT.md`
  - related API/store tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0100-payment-real-gateway-and-ledger-completion.md`
  - `0101-upload-object-storage-and-review-completion.md`
  - `0102-messaging-realtime-conversation-completion.md`
  - `0112-security-risk-device-and-audit-baseline.md`
- blocked by:
  - production persistence backend and job runner choice
- integration notes:
  - job operations must be idempotent and safe to retry

## Affected Paths

- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for job status, audit query, and operational diagnostics if exposed
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - no, unless admin operations are exposed through feature controllers
- route param changes allowed:
  - no

## Verification

- slice gate:
  - critical business records survive process restart and background jobs are idempotent
- generation needed:
  - none
- final verifier handoff:
  - include migration and job retry notes

## Acceptance

- [ ] durable store schemas cover core business domains
- [ ] migrations or backfills are defined
- [ ] cleanup/reconciliation/retry jobs are idempotent
- [ ] audit and monitoring hooks exist for critical operations
- [ ] tests cover persistence and job retry behavior
- [ ] `pnpm verify` run
