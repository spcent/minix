# Roadmap

## Current Scope

`v0.1` proves one shared product path across WeChat and H5:

`login -> /auth/login -> protected /items -> settings -> logout`

The current goal is architectural confidence, not product breadth.

## Frozen v1.0 Support Surface

`v1.0` is frozen to four official sample apps:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The release goal is not to add more product breadth. It is to make these four samples reliable, explicit, and supportable under one shared MiniX kernel story.

## Near-Term Priorities

1. Freeze the `v1.0` release contract, support matrix, and non-goals.
2. Harden auth, session, request, and protected-route behavior across H5 and WeChat.
3. Replace accidental mock-first release behavior with explicit environment selection.
4. Keep host wiring manifest- and registry-driven.
5. Add release-grade verification beyond static guards and unit tests.
6. Align docs and sample hosts with the actual shipped support surface.

## Deferred Until Scope Changes

- new platform targets
- new top-level shared packages without a strong boundary reason
- broad UI abstraction layers
- feature breadth unrelated to the frozen `v1.0` host and novel sample surface
