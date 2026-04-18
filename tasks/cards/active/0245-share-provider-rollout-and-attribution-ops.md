# Card 0245 Share Provider Rollout And Attribution Ops

## Summary

Execute the remaining operator-owned share rollout for short-link, poster-generation, and attribution verification on the deployed target.

## Goal

Provision real share providers, validate deployed short-link and poster URLs, and capture rollout evidence for attribution flows.

## Milestone

- milestone file: none
- slice name: `share provider rollout and attribution ops`

## Priority

- priority: `P0`

## Scope

- In scope:
  - provision production short-link and poster-generation providers outside tracked source
  - configure `MINIX_SHARE_PROVIDER_MODE`, `MINIX_SHARE_SHORT_LINK_PROVIDER`, `MINIX_SHARE_POSTER_PROVIDER`, `MINIX_SHARE_SHORT_LINK_BASE_URL`, and `MINIX_SHARE_POSTER_BASE_URL`
  - validate deployed short-link resolution, poster URLs, and return-attribution recognition
  - capture provider ownership and attribution evidence in release logs
- Out of scope:
  - changing the shared share route set or media-tools surface structure

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - committed provider secrets or private short-link service credentials

## Dependencies

- depends on:
  - `tasks/cards/done/0237-share-provider-cutover-and-attribution-validation.md`
- blocked by:
  - selected short-link and poster-generation providers plus deployed host ownership
- integration notes:
  - repository code already exposes sample-versus-production posture; remaining work is external rollout and verification

## Affected Paths

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - share release no longer depends on sample short-link or poster posture
- generation needed:
  - none
- final verifier handoff:
  - include provider labels, deployed URL validation, and attribution evidence

## Acceptance

- [ ] production short-link and poster providers are configured on the target environment
- [ ] deployed short-link resolution and poster URLs are validated
- [ ] attribution and return-recognition evidence is captured in release logs
- [ ] provider ownership and rollout notes are recorded for release signoff
- [ ] code verification intentionally skipped if rollout remains docs and ops only

## Implementation Notes

- repo code already exposes normalized share rollout posture and attribution metadata without needing host-local wrappers
- `/ops/diagnostics` now exposes `providerReadiness.share.distribution` so short-link, poster, and URL-host readiness is visible on the deployed target
- release docs now require short-link provider, poster provider, deployed URL checks, and attribution validation evidence in the release log
- preview and production verification can now emit repeatable evidence packs with `MINIX_REMOTE_EVIDENCE_OUTPUT=... pnpm verify:api:remote`, then render release-log snippets with `pnpm verify:api:remote:render <evidence-path> <label>`

## Verification Notes

- docs-only operator handoff update; no additional code verification was needed for this card
