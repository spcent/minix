---
title: Change Contract
applies_to:
  - packages/contracts
  - packages/core
---

# Change Contract

## Use When

Adjust route ids, shared payloads, or backend-facing types that affect multiple layers.

## Default Steps

1. Change the shared contract in `packages/contracts`.
2. Update core runtime or ports only where the shared surface requires it.
3. Update feature packages, platform adapters, and host wiring that consume the contract.
4. Update docs when the shared behavior or workflow changes.
5. Run `pnpm verify`.

## Guardrails

- Avoid widening the public surface without a clear need.
- Prefer narrow changes that preserve existing entry points.
- Treat contract edits as cross-layer changes and verify all affected hosts.
