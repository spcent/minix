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

All platform-specific logic must live under `packages/platform-*`.

Application services and pages must not call raw platform APIs directly.

Forbidden in business/domain code:

- `wx.*`
- `tt.*`
- `my.*`
- direct `window.*` platform assumptions

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

MiniX is split into 6 layers:

### Layer 1: Kernel Core
Pure cross-platform logic:

- error model
- result model
- config/env
- request pipeline
- session
- storage abstraction
- telemetry model
- page/list/form/settings/profile protocols
- state container

### Layer 2: Domain Services
Reusable business services:

- auth flow orchestration
- user profile service
- content/lesson/info services
- feature-specific services

### Layer 3: Adapter Contracts
Platform capability contracts:

- auth
- request
- storage
- router
- lifecycle
- telemetry
- capability
- UI

### Layer 4: Platform Implementations
Concrete implementations for:

- wechat
- h5
- future: douyin
- future: alipay

### Layer 5: Page Protocols
Reusable page-level model contracts:

- list page
- detail page
- form page
- settings page
- profile page
- dashboard page

### Layer 6: Thin UI Layer
Minimal UI primitives and shells:

- button
- cell
- input
- empty state
- error state
- loading state
- modal/toast wrappers
- layout shells

---

# MiniX v0.1 Architecture

## Scope

`v0.1` only validates one core path:

`bootstrap -> ensureLogin -> request -> items page -> settings -> logout`

The implementation target is WeChat Mini Program first. H5 only exists to verify that shared abstractions are not WeChat-specific.

## Frozen v1.0 Support Surface

`v1.0` is frozen to four official sample apps:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The release goal is to make these four samples reliable under one explicit kernel contract, not to broaden MiniX into a larger framework.

## Production Readiness Boundary

The repository now distinguishes between:

- release-complete shared behavior and sample-host coverage
- operator-owned external setup such as real provider credentials, WeChat console allowlists, and Cloudflare resource ids

That boundary is intentional. MiniX `v1.0.0` freezes a defensible official-sample system, not a credentials-in-repo turnkey SaaS deployment.

For the exact release boundary, provider setup, capability support matrix, and accepted deferred issues, use [`docs/PRODUCTION_READINESS.md`](/docs/PRODUCTION_READINESS.md).

## Layers

### Contracts

Stable shared contracts live in `packages/contracts`:

- backend request and response shapes
- route ids and route maps
- feature-facing shared payload types

### Core

### Sample API Structure

The sample API under `apps/api/src` now follows the same explicit-boundary rule as the runtime packages.

Use these layers:

- `app.ts`: app creation plus top-level middleware only
- `app-composition*.ts`: route-group wiring, security wiring, and job wiring
- `http/*`: shared request parsing, auth header helpers, CORS, response helpers, and route-context loaders
- `domains/*/routes.ts`: the public domain entry that mounts that domain's route tree
- `domains/*/routes.*.ts`: domain-internal route slices split by business concern
- `domains/*/route-options.ts`: the domain's route registration option type
- `domains/*/route-helpers.ts`: domain-local helper wiring when a route family shares repeated orchestration

The practical rule is:

- composition layers import only each domain's `routes.ts`
- `routes.ts` stays an assembly file
- business HTTP handlers live in `routes.*.ts`
- shared HTTP concerns go in `http/*`
- cross-domain business derivation belongs in the existing domain modules, not back in `app.ts`

Current reference examples:

- `apps/api/src/domains/payment/routes.ts` assembles `routes.commerce.ts`, `routes.after-sales.ts`, and `routes.callbacks.ts`
- `apps/api/src/domains/account/routes.ts` assembles `routes.identity.ts`, `routes.security.ts`, and `routes.relations.ts`

When adding new API behavior, do not reopen a monolithic `routes.ts`, `app.ts`, or `data.ts` file. Extend the relevant domain slice or add a new `routes.*.ts` module under that domain instead.

Shared business runtime lives in `packages/core`:

- `src/ports/*`: host-facing contracts and adapter interfaces
- `src/runtime/*`: shared orchestration and service composition
- `src/store/*`: cache, page models, and lightweight state containers
- `src/error/*` and `src/types/*`: shared primitives used across the runtime

Core code must not directly call `wx.*` or `window.*`.

### Features

Reusable business logic lives in `packages/features/*`:

- `auth`
- `items`
- `settings`

Feature packages may depend on `contracts` and `core`, but not on platform packages.

### Platform Adapters

Platform-specific code lives only in:

- `packages/platform-wechat/src/adapters/*`
- `packages/platform-h5/src/adapters/*`

Adapters translate host APIs into stable core contracts.

### Host Apps

`apps/host-wechat` and `apps/host-h5` prove the architecture with minimal host flows.

Host apps may orchestrate manifests, mock wiring, and platform registration, but they must not own shared business flows.

Within each host, `src/manifest/page-definitions.ts` is the editable source of truth for page wiring:

- host page enablement lives in `page-definitions.ts`
- host-specific overrides such as route path, render mode, shell metadata, and UI policy live alongside each page definition
- feature-owned defaults should stay in `packages/features/*`
- generated `app.manifest.ts`, `page-manifest.ts`, `page-config.ts`, and `src/registrations/page-registry.ts` are derived outputs
- `runtime.pages` is derived from generated registries instead of duplicated by hand
- shell modules may call generic page-entry helpers, but should not define business behavior

This keeps the architecture explicit without introducing a unified view DSL: platform differences remain visible in host manifests and platform adapters, while shared business changes stay inside feature packages.

Within each host, `src/manifest/page-manifest.ts` is a runtime-loadable typed data module:

- route ids and route paths live in importable host page metadata
- host route maps are derived from that metadata instead of handwritten duplicates
- scripts and scaffolds should read the manifest directly instead of regex-parsing unrelated wiring files

Within each host, `src/manifest/page-definitions.ts` is the editable source of truth for host page definitions:

- feature flags and page definitions live behind explicit builder helpers so shape checks happen at the source boundary
- `src/manifest/app.manifest.ts` is generated from that source instead of being hand-maintained
- guards and scaffolds should update the source module, then regenerate derived host manifest files
- protected-route recovery is evaluated by the shared manifest runtime, which preserves route id, path, params, source, and re-auth reason before redirecting to login

Within each host, `src/manifest/page-config.ts` isolates host-owned configurable page state:

- host page defaults stay outside kernel bootstrap assembly
- guards and scaffolds can update configurable page coverage without parsing `app.manifest.ts`

Within `apps/host-h5`, render coverage is also metadata-driven:

- `src/manifest/page-manifest.ts` declares whether a page uses `custom` or `generic` rendering
- `src/render/page-registry.ts` exports the custom renderer registry for tooling and guards

## Frozen v0.1 Contracts

The following contracts are allowed to shape the first implementation:

- `AppError` and `Result<T>`
- `StorageAdapter`
- `RequestAdapter`
- `AuthAdapter`
- `RouterAdapter`
- minimal `UIAdapter`

The following remain out of scope until the host proof validates the first path:

- telemetry
- capability detection
- lifecycle abstraction
- app kit and code generators

## v1.0 Release Boundary

For `v1.0`, the official support promise is narrower than the broad capability list in the overview sections above.

`v1.0` must support:

- shared auth, request, session, router, storage, and minimal UI contracts
- manifest-driven host wiring for `host-*` and `novel-*`
- official H5 and WeChat samples for both the narrow shared flow and the richer novel flow

`v1.0` does not yet promise:

- a formal telemetry abstraction
- a formal lifecycle abstraction
- a formal capability abstraction
- new platform targets beyond H5 and WeChat
- a unified rendering layer across hosts

## Acceptance

The architecture is considered valid only if:

1. the WeChat host completes the main flow
2. all platform differences stay inside adapters
3. services consistently return `Result<T>`
4. adding a new items-style page does not require new core contracts
5. route selection happens through route ids plus host route maps
6. shared layers do not directly reference `wx.*` or `window.*`, and `pnpm verify` enforces that rule
