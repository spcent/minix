# Card 0041 API Host Integration And E2E Gates

## Summary

Upgrade API verification from route-level tests and Node smoke scripts into host-level integration checks that exercise the official sample apps against the real local API.

## Goal

Catch regressions that only show up when the host apps talk to the real API through their runtime adapters.

## Milestone

- milestone file: none
- slice name: `api integration verification`

## Scope

- In scope:
  - add host-to-API integration gates for the four official sample apps
  - cover login, protected route access, reader or shelf persistence, and membership unlock flows
  - make CI fail on broken host or API integration
  - document how to run the integration gate locally
- Out of scope:
  - visual regression tooling
  - exhaustive platform-device matrix
  - unrelated host UI redesign

## Ownership

- owned files:
  - `apps/api/**`
  - `scripts/**` related to API or smoke verification
  - `.github/workflows/**` if needed for API integration gating
  - relevant docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/features/**` except for compatibility fixes required by the gate

## Dependencies

- depends on:
  - `apps/api/**`
  - `0038-api-h5-cors-and-origin-policy.md`
- blocked by:
  - none
- integration notes:
  - prefer a gate that starts the API, runs host-level checks, and exits cleanly without manual process cleanup

## Affected Paths

- `apps/api/**`
- `scripts/**`
- `.github/workflows/**`
- `README.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none unless required to expose real integration failures
- route param changes allowed:
  - none

## Verification

- slice gate:
  - automated integration run against all official samples
- generation needed:
  - none
- final verifier handoff:
  - CI should prove the four sample apps still work against the real local API path

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
