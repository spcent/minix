# MiniX Architecture

## 1. Overview

MiniX is an agent-friendly, runtime-zero-dependency application kernel for Mini Programs and H5.

It is designed for multi-app product matrices such as education tools, utility apps, and information-management apps, where many capabilities repeat across products:

- authentication and session management
- user profile and preferences
- request pipeline and API access
- storage and state recovery
- telemetry and monitoring
- page shells and layout presets
- platform capability detection
- routing abstraction
- page model reuse

MiniX does **not** aim to be a full cross-platform rendering framework like uni-app or Taro.

Instead, MiniX follows this model:

- shared business kernel
- explicit platform adapters
- reusable page protocols
- thin per-platform view implementations

---

## 2. Goals

### 2.1 Primary Goals

MiniX must provide:

1. Runtime zero dependencies
2. Shared business kernel across mini program and H5
3. Explicit platform adaptation boundaries
4. Agent-friendly code organization
5. Stable interfaces for repeated app generation
6. Strong control over authentication, requests, telemetry, and layouts

### 2.2 Non-goals

MiniX does not aim to provide:

1. full view-layer unification across all platforms
2. a template compiler or DSL
3. a huge UI component ecosystem
4. all platform-specific advanced capability abstractions
5. magic runtime behavior that hides platform boundaries

---

## 3. Architecture Principles

### 3.1 Runtime Zero Dependency

Runtime code must depend only on:

- official mini program APIs
- standard browser Web APIs
- MiniX internal source code

Development-time tools may exist, but they are excluded from runtime.

### 3.2 Shared Kernel, Not Forced Shared Views

MiniX shares:

- data and state models
- request/auth/session logic
- telemetry model
- page protocols
- layout contracts
- capability contracts

MiniX does not force shared source code for:

- view templates
- style implementations
- complex interactive components

### 3.3 Explicit Platform Boundaries

Shared business code must not call raw host APIs directly.

Forbidden in shared packages and business/domain code:

- `wx.*`
- `tt.*`
- `my.*`
- direct `window.*` platform assumptions

Platform adapters own reusable host integration under `packages/platform-*`. Host apps may still contain host-only bootstrap, rendering, and shell code, but shared behavior should move to `packages/features/*` or `packages/core`.

### 3.4 Protocol First

Stable contracts are preferred over implicit conventions and magic APIs.

MiniX is built around explicit interfaces such as:

- RequestAdapter
- StorageAdapter
- AuthAdapter
- RouterAdapter
- LifecycleAdapter
- TelemetryAdapter
- CapabilityAdapter
- UIAdapter

### 3.5 Unified Error Model

All modules must return a shared `Result<T>` type or a normalized `AppError`.

Business services should not throw uncontrolled platform-native exceptions.

### 3.6 Fixed Project Shape

Repository and module structure must stay stable so that agents can:

- locate modules deterministically
- patch only the right files
- generate new modules from templates
- validate adapter contracts

---

## 4. High-level Layer Model

MiniX uses the package layers that exist in the current workspace:

1. `packages/contracts`
   Shared route ids, backend-facing request/response types, and canonical domain output shapes.
2. `packages/core`
   Shared ports, runtime orchestration, page protocols, store primitives, error handling, and common runtime types.
3. `packages/features/*`
   Platform-agnostic business controllers, state projection, feature manifests, and feature-owned defaults.
4. `packages/platform-h5` and `packages/platform-wechat`
   Reusable browser and WeChat adapters that satisfy core ports.
5. `apps/*`
   Host bootstrap, manifest source, page registrations, rendering glue, and generated host shell output.
6. `apps/api`
   Sample backend app with explicit HTTP, composition, and domain slices.

New platform families, UI frameworks, or top-level shared packages are outside the current release line unless a task explicitly records that scope decision.

---

## 5. Current Repository Shape

The repository is now frozen to the `v1.0.0` sample surface:

- `apps/api`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The goal is to keep these samples reliable under one explicit kernel contract. MiniX is not expanding into a broader rendering framework or new platform family in the current release line.

## 6. Shared Code Placement

### Contracts

`packages/contracts` owns:

- backend request and response shapes
- route ids and route maps
- canonical domain output shapes
- shared page and capability contracts

When a domain surface changes across more than one host, change the contract first instead of adapting one caller locally.

### Core

`packages/core` owns:

- `src/ports/*`: adapter-facing contracts
- `src/runtime/*`: shared orchestration and service composition
- `src/store/*`: shared page models and state containers
- `src/error/*` and `src/types/*`: runtime primitives

Cross-feature runtime helpers belong here, not inside one feature package.

### Features

`packages/features/*` owns:

- normalized controller state
- cross-host route synchronization
- action lifecycle
- feature-owned defaults and host-facing manifests

Feature packages may depend on `contracts` and `core`, but not on platform packages or host apps.

When continuing an existing capability:

- prefer extending the existing feature package over creating a sibling package
- reuse canonical domain outputs instead of adding feature-local wrappers
- reuse shared page protocols before inventing bespoke loading, detail, or form state

### Platform Adapters

Platform-specific code lives only in:

- `packages/platform-wechat/src/adapters/*`
- `packages/platform-h5/src/adapters/*`

Adapters translate host APIs into stable core contracts. Shared code must not call `wx.*` or `window.*` directly.

Capability health should be exposed back to shared code as normalized snapshots. Runtime adapters still own the raw host API checks, but shared controllers should consume one additive snapshot shape for payment, share, upload, clipboard, and location instead of building host-local diagnostic branches.

### Hosts

Host apps own enablement and host-only policy, not shared business behavior.

Editable source of truth:

- `apps/*/src/manifest/page-definitions.ts`

Derived outputs:

- `src/manifest/app.manifest.ts`
- `src/manifest/page-manifest.ts`
- `src/manifest/page-config.ts`
- `src/registrations/page-registry.ts`
- WeChat shell outputs

Change the source manifest, then regenerate derived files. Do not patch generated host files manually.

### Sample API

The sample API under `apps/api/src` follows the same explicit-boundary rule.

Use these layers:

- `app.ts`: app creation and top-level middleware only
- `app-composition*.ts`: route-group and top-level wiring
- `http/*`: shared request, auth-header, CORS, and response helpers
- `domains/*/routes.ts`: domain entry and assembly
- `domains/*/routes.*.ts`: domain-internal route slices

Practical rules:

- `app.ts` and composition layers stay thin
- `routes.ts` stays an assembly file
- business handlers and workflow shaping live in the domain slices
- cross-domain business derivation stays in domain modules, not back in `app.ts`

## 7. Completion Rules

When continuing feature or code completion work, prefer closing the whole shared slice rather than patching a single host.

Core rules:

1. Normalize outputs to the canonical domain envelopes documented in [`docs/BACKEND_CONTRACT.md`](/docs/BACKEND_CONTRACT.md).
2. Keep route restore, selection restore, unauthorized return, and shared action state inside shared controllers when the behavior is cross-host.
3. Treat account and settings as summary workspaces; do not force them into fake list/detail shells.
4. Keep provider posture explicit. If production behavior still depends on operator rollout, fail closed in production mode and document the remaining operator step.
5. Record intentional exceptions or remaining rollout gaps in [`docs/DOMAIN_COMPLETENESS_MATRIX.md`](/docs/DOMAIN_COMPLETENESS_MATRIX.md) instead of burying them in host copy or controller drift.
6. Future content and discover growth must extend the existing shared discover, content, upload, and feedback stack additively before any new route family is justified.
7. Future user and relationship growth must extend the shared account workspace additively before any dedicated user-detail surface is justified.
8. Capability UX hardening should improve normalized shared capability summaries first; runtime-specific branching still belongs in `packages/platform-*`.
9. Capability health snapshots should stay in shared controller state and reuse the same snapshot vocabulary across features before any host-visible diagnostics copy is added.

## 8. Shared Protocol Posture

MiniX prefers shared page protocols over feature-local state machines.

Current posture:

- list-like surfaces should use the shared list protocol
- detail-like surfaces should use the shared detail protocol
- workflow and submit surfaces should use the shared form protocol
- account and settings remain explicit summary-workspace exceptions
- reader remains an explicit immersive-runtime exception
- auth login and identity handoff remain provider-aware workflow exceptions

If a feature starts duplicating list/detail/form state by hand, the architecture expectation is to stop and move that behavior back onto the shared protocol surface.

## 9. Release Boundary

The repository distinguishes between:

- release-complete shared behavior and official-host coverage
- operator-owned external setup such as real provider credentials, WeChat allowlists, and Cloudflare resource ids

That split is intentional. `v1.0.0` is a defensible official-sample system, not a credentials-in-repo turnkey deployment.

For exact release readiness and operator setup, use [`docs/PRODUCTION_READINESS.md`](/docs/PRODUCTION_READINESS.md) and [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md).

## 10. Validation And Acceptance

Architecture changes are only acceptable when all of the following remain true:

1. shared layers do not directly reference host globals
2. platform differences stay in adapters or host manifests
3. services and expected business failures stay on `Result<T>` or normalized app errors
4. route selection stays manifest-driven through route ids and host metadata
5. new shared behavior does not require hand-maintained duplicate route maps or generated-file edits
6. validation continues to pass through `pnpm verify` and any relevant scoped feature or host checks
