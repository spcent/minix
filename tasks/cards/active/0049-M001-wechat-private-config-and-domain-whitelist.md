# M001 Card 0049 WeChat Private Config And Domain Whitelist

## Summary

Prepare the official WeChat samples for real release validation by documenting and templating the private config, app id, and request-domain setup that cannot live in tracked source.

## Goal

Remove the gap between repo-ready WeChat samples and actually releasable Mini Program projects by making the private config and platform-console requirements explicit and repeatable.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `wechat release configuration`

## Scope

- In scope:
  - define the ignored private-config files or setup pattern for real WeChat app ids
  - document the request-domain and upload-domain allowlist requirements for the official API targets
  - describe the minimum private config needed for `host-wechat` and `novel-wechat`
  - make the release path explicit without committing sensitive WeChat project settings
- Out of scope:
  - automating WeChat console actions
  - changing the official WeChat route sets
  - replacing WeChat DevTools workflows

## Ownership

- owned files:
  - `README.md`
  - `apps/host-wechat/**`
  - `apps/novel-wechat/**`
  - `docs/**`
  - optional ignored config examples under `apps/*`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`

## Dependencies

- depends on:
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
  - `0047-M001-release-runbook-and-manual-wechat-gate.md`
- blocked by:
  - real WeChat app ids and final request-domain values
- integration notes:
  - keep all sensitive WeChat project settings out of tracked source

## Affected Paths

- `README.md`
- `apps/host-wechat/**`
- `apps/novel-wechat/**`
- `docs/**`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

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
  - both official WeChat samples have a documented private-config path and release-domain checklist
- generation needed:
  - none
- final verifier handoff:
  - record which private files are expected locally and which domain values must be configured in WeChat

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
