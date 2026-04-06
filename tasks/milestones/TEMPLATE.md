# Milestone Spec Template

## Summary

One-paragraph description of the milestone.

## Goal

What this milestone should achieve at the product, architecture, or workflow level.

## Non-goals

- explicitly excluded item
- explicitly excluded item

## Scope

- In scope:
- Out of scope:

## Affected Packages

- `packages/contracts/...`
- `packages/core/...`
- `packages/features/...`
- `packages/tooling/...`
- `apps/...`

## Route Impact

- affected routes:
- new route params:
- removed route params:
- host manifest impact:

## Contract Impact

- changed shared contract types:
- changed controller options:
- changed store shape:
- changed action names:

If no shared interface changes are needed, say so explicitly.

## Interface Freeze

Freeze these before task decomposition:

- contracts:
- feature store shape:
- controller actions:
- route ids / route params:
- storage keys:
- generated outputs impacted:

## Execution Plan

### Critical Path

- step
- step

### Parallel Slices

- slice name:
  owned by:
  write set:
  depends on:

- slice name:
  owned by:
  write set:
  depends on:

### Integrator Responsibilities

- update host source manifests if needed
- run generation steps
- resolve cross-slice conflicts
- prepare final verification summary

## Verification Plan

### Slice Gates

- `pnpm verify:feature <name>`
- targeted tests:

### Integration Gates

- `pnpm gen:manifests`
- `pnpm gen:shells`

### Final Gate

- `pnpm verify`

### Manual Review Path

- route flow to click through:
- state transitions to confirm:
- regressions to watch:

## Acceptance

- [ ] shared boundaries remain explicit
- [ ] platform-specific behavior stays out of shared code
- [ ] manifest source files remain the host source of truth
- [ ] generated outputs are regenerated, not hand-authored
- [ ] verification results are recorded

## Risks / Follow-ups

- risk:
- follow-up:
