# MiniX Docs

This folder documents the current `v1.0.0` official-sample surface. It should describe what the repository supports now, what remains operator-owned, and how to make bounded changes without widening scope by accident.

## Start Here

- [`../README.md`](../README.md): repository overview, setup, commands, and release links
- [`../AGENTS.md`](../AGENTS.md): compact rules for coding agents
- [`./AGENT_GUIDE.md`](./AGENT_GUIDE.md): practical change-order and completion checklist
- [`./QUICK_ARCHITECTURE.md`](./QUICK_ARCHITECTURE.md): five-minute map for common changes
- [`./ARCHITECTURE.md`](./ARCHITECTURE.md): current package boundaries and runtime shape

## Current Behavior And Contracts

- [`./BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md): canonical API/domain envelopes and route posture
- [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md): domain ownership, host exposure, and remaining release gaps
- [`../packages/features/README.md`](../packages/features/README.md): feature-package rules and test expectations
- [`./architecture/`](./architecture/): smaller architecture notes for layers and host wiring
- [`./modules/`](./modules/): package responsibility notes by workspace area

## Release And Operations

- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md): production boundary, operator setup, provider-readiness interpretation
- [`./PRODUCTION_REGRESSION_MATRIX.md`](./PRODUCTION_REGRESSION_MATRIX.md): automated and manual release coverage
- [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md): preview and production promotion sequence
- [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md): tracked verification evidence ledger
- `pnpm release:report`: copy-ready release evidence report for `VERIFICATION_LOG.md`
- [`./RELEASE_NOTES_TEMPLATE.md`](./RELEASE_NOTES_TEMPLATE.md): release-note template
- [`./RELEASE_v1.0.0.md`](./RELEASE_v1.0.0.md): tracked release-cut record

## Planning

- [`./ROADMAP.md`](./ROADMAP.md): current priorities and safe expansion rules
- [`./FEATURE_REUSE_MATRIX.md`](./FEATURE_REUSE_MATRIX.md): current feature reuse across the four official hosts
- [`../tasks/cards/`](../tasks/cards/): task-card queue and historical implementation records
- [`../tasks/milestones/`](../tasks/milestones/): milestone records

## Maintenance Rules

- Keep current operational truth in `README.md`, `AGENTS.md`, `AGENT_GUIDE.md`, `ARCHITECTURE.md`, and the release docs.
- Do not keep old proposals in this folder if they describe already-completed migrations as future work.
- Prefer replacing stale task-card rollups with links to the active queue and current source of truth.
- When a behavior, workflow, release posture, or accepted exception changes, update the contract/readiness/matrix docs in the same change.
