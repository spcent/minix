# Task Card Template

## Summary

One-sentence statement of the intended change.

## Goal

What user-visible or architecture-visible outcome this task should produce.

## Milestone

- milestone file:
- slice name:

## Scope

- In scope:
- Out of scope:

## Ownership

- owned files:
- allowed generated outputs:
- forbidden files:

Use `forbidden files` to protect shared high-conflict areas when another slice owns them.

## Dependencies

- depends on:
- blocked by:
- integration notes:

## Affected Paths

- `packages/...`
- `apps/...`
- `docs/...`
- `specs/...`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/...`

## Interface Notes

- contract changes allowed:
- store shape changes allowed:
- controller action changes allowed:
- route param changes allowed:

If the answer is `no`, say `none`.

## Verification

- slice gate:
- generation needed:
- final verifier handoff:

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
