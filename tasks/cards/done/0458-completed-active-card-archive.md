# Card 0458 Completed Active Card Archive

## Summary

Move completed task cards out of `active` and into `done`.

## Goal

Keep `tasks/cards/active` limited to unfinished work so future execution order is clear and completed refactor slices do not obscure remaining release-operator cards.

## Milestone

- milestone file: none
- slice name: `completed active card archive`

## Scope

- In scope:
  - archive active cards that already contain completed acceptance and verification notes
  - leave unfinished provider rollout and release execution cards active
- Out of scope:
  - code changes
  - changing task card content beyond the new archive card
  - revalidating historical implementation work

## Ownership

- owned files:
  - `tasks/cards/active/*.md`
  - `tasks/cards/done/*.md`
- allowed generated outputs:
  - none
- forbidden files:
  - source code
  - generated host manifests and registries

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Move only cards that are already marked accepted; do not close 0241-0246.

## Affected Paths

- `tasks/cards/active`
- `tasks/cards/done`

## Related Specs

- `tasks/cards/README.md`

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
  - docs/task-card move only; no code validation required
- generation needed:
  - none
- final verifier handoff:
  - `active` should contain only unfinished rollout/release cards after this archive pass.

## Acceptance

## Implementation Notes

- Moved completed cards `0399` through `0452` from `active` to `done`.
- Left unfinished rollout and release execution cards `0241` through `0246` in `active`.

## Verification Notes

- Confirmed `tasks/cards/active` contains only `0241` through `0246`.
- Skipped `pnpm verify`; this is a task-card-only archive move.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
