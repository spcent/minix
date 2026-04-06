# M001 Card 0052 API Observability And Support Debugging

## Summary

Strengthen the remote API debugging story so preview and production incidents can be investigated without guesswork.

## Goal

Give release operators enough visibility into auth, request failure, and Worker-side issues to support the official samples after `v1.0` goes live.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `post-deploy debugging readiness`

## Scope

- In scope:
  - review current API logs and error response shape for operator usefulness
  - document or implement a minimum request-correlation and tailing strategy
  - make the runbook clearer about how to inspect preview and production failures
  - keep token and secret material out of logs while improving triage value
- Out of scope:
  - full analytics infrastructure
  - a hosted observability platform rollout
  - changing the shared host feature scope

## Ownership

- owned files:
  - `apps/api/**`
  - `docs/**`
  - `scripts/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/host-*/**`
  - `apps/novel-*/**`

## Dependencies

- depends on:
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
  - `0044-M001-api-auth-security-and-abuse-controls.md`
  - `0047-M001-release-runbook-and-manual-wechat-gate.md`
- blocked by:
  - none
- integration notes:
  - observability improvements must preserve the current no-token-leak policy

## Affected Paths

- `apps/api/**`
- `docs/**`
- `scripts/**`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - narrow error-response additions only if they improve operator debugging without widening client obligations
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - preview or local operator can trace request failures through the documented debugging path
- generation needed:
  - none
- final verifier handoff:
  - record the minimum debugging path for auth, CORS, and remote Worker failures

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
