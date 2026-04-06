# Layer Model

MiniX uses a narrow dependency direction to keep shared behavior portable and host behavior explicit.

## Layers

1. `packages/contracts`
   Shared route ids and backend-facing types.
2. `packages/core`
   Shared ports, runtime orchestration, state, and base primitives.
3. `packages/features/*`
   Platform-agnostic business behavior such as `auth`, `items`, and `settings`.
4. `packages/platform-*`
   Concrete platform adapters for WeChat and H5.
5. `apps/host-*`
   Host manifests, bootstrap, registrations, and generated or host-only shell code.

## Allowed Direction

```text
contracts <- core <- features
contracts <- platform-*
core      <- platform-*
contracts <- apps/host-*
core      <- apps/host-*
platform-*<- apps/host-*
features  <- apps/host-*
```

Practical rule: dependencies may point downward toward more stable shared layers, not upward into host-owned behavior.

## Guardrails

- Shared code must not call `wx.*` or `window.*` directly.
- Features must not depend on platform packages or host apps.
- Cross-package imports must go through package entry points only.
- Host route wiring must remain manifest- and registry-driven.

Related references:

- [Dependency Rules Spec](../../specs/dependency-rules.yaml)
- [Agent Guide](../AGENT_GUIDE.md)
