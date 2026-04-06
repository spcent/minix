# P3-1 Detail Dossier Follow-up

## Summary

Push the title detail page from “good dossier” to “fully persuasive dossier”.

## Goal

Increase trust and clarity before reading, shelving, or purchasing.

## Scope

- In scope: richer update history cues
- In scope: stronger author presence
- In scope: clearer trial rules and access explanation
- In scope: expanded related-title framing
- Out of scope: comments or social proof systems with real moderation

## Affected Paths

- `packages/contracts/src/api/novel-detail.ts`
- `apps/novel-h5/src/bootstrap/mock-api.ts`
- `apps/novel-wechat/src/bootstrap/mock-api.ts`
- `apps/novel-h5/src/render/pages/novel-detail.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] detail gives a clearer reason to start, continue, shelf, or unlock
- [x] access rules and reputation signals do not conflict
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
