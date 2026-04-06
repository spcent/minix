# Verifier Checklist Template

Use this file as the final verification handoff for an integrated milestone or grouped task batch.

## Scope

- milestone:
- cards included:
- integrator:
- verifier:

## Shared Boundary Checks

- [ ] no shared code calls `wx.*` directly
- [ ] no shared code calls `window.*` directly
- [ ] expected failures still use `Result<T>`
- [ ] no deep imports were introduced
- [ ] package entry points remain intact

## Host Wiring Checks

- [ ] host source changes live in `apps/*/src/manifest/page-definitions.ts`
- [ ] generated manifests were regenerated instead of hand-edited
- [ ] generated WeChat shell outputs were regenerated instead of hand-edited
- [ ] route ids and params match contracts and feature expectations

## Interface Freeze Checks

- [ ] contract changes match the milestone spec
- [ ] feature store shape changes match the milestone spec
- [ ] controller action changes match the milestone spec
- [ ] storage key changes are intentional and documented

## Verification Commands

- [ ] `pnpm gen:manifests`
- [ ] `pnpm gen:shells`
- [ ] targeted slice verification:
- [ ] `pnpm verify`

If a command was intentionally skipped, record the reason here.

## Manual Review

- routes walked:
- host(s) checked:
- key state transitions checked:
- known weak spots:

## Findings

- finding:
- finding:

## Final Result

- [ ] ready for human milestone review
- [ ] follow-up cards required

## Follow-ups

- follow-up:
- follow-up:
