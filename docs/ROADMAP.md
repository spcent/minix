# Roadmap

This roadmap reflects the current `v1.0.0` repository posture. It is not a product wish list. It is a bounded view of what should be tightened next, what can be expanded safely, and what still requires an explicit scope decision.

Use it together with:

- [`../README.md`](../README.md)
- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)

## Current Posture

The current official sample surface is:

- `apps/api`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The repo has already completed the main shared-kernel work for:

- canonical domain outputs
- shared page-protocol adoption
- shared account and settings summaries
- richer account workspace summaries for relations, asset history, security posture, and cancellation follow-up
- richer settings workspace summaries for policy-source, notification presets, device behavior, and environment governance
- discover and content-search normalization
- cross-domain context envelopes
- auth risk, recovery, and provider-capability metadata inside the shared auth envelope

The main remaining release gap is no longer kernel shape. It is operator rollout and evidence capture for provider-backed areas.

## Priority 0: Release Closure

These are the only true short-term blockers for the frozen release surface:

1. close auth provider rollout and callback readiness
2. close message provider rollout and polling acceptance
3. close payment merchant and callback rollout
4. close upload provider and asset-host rollout
5. close share provider and attribution rollout
6. capture final release execution evidence and signoff

Reference queue:

- [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md)
- `tasks/cards/active/0241` through `0247`

## Priority 1: Post-Release Hardening

After release closure, the next safe improvements are still inside the current scope.

### 1. Provider Adapters And Ops Hardening

Keep the shared contracts stable, but improve the production path around them:

- real SMS and OAuth provider adapters
- real merchant and callback diagnostics
- real upload storage and review backends
- real short-link and poster providers
- stronger environment validation and rollout checklists

This should harden the existing domains, not widen them.

Recommended cards:

- [`../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md`](../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md)

### 2. Verification And Evidence Automation

The repo should reduce manual release drift further:

- stronger remote verification around preview and production parity
- clearer evidence capture for operator-owned rollout decisions
- more targeted blackbox coverage for cross-host route restore, identity transitions, and provider-fallback posture
- better regression guards for canonical output envelopes and protocol exceptions

Recommended cards:

- [`../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md`](../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md)

### 3. Shared Contract Governance

The current shared envelopes are in place, but future hardening can still improve discipline:

- contract snapshot or schema drift checks
- stricter normalization guards for shared domain outputs
- more explicit compatibility policy for additive response fields
- clearer boundaries for summary-workspace exceptions such as account and settings

Recommended cards:

- [`../tasks/cards/done/0255-shared-contract-governance-hardening.md`](../tasks/cards/done/0255-shared-contract-governance-hardening.md)

## Priority 2: Safe Product-Surface Expansion

These directions fit the current kernel story, but they should start only after release closure and only if they reuse the existing shared shape.

The current repo-side boundary for these directions is already documented in [`./BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md), [`./ARCHITECTURE.md`](./ARCHITECTURE.md), and [`./DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md). Future work should extend those baselines, not reopen them implicitly.

### 1. Richer Content And Discover Flows

Possible expansions:

- more explicit editorial or managed-content workflows on top of the shared discover lane
- richer recommendation or ranking strategies
- stronger content lifecycle review and moderation posture
- more complete attachment, asset, and derived-content metadata

The rule is to extend the current content, search, upload, and feedback contracts instead of creating a second content stack.

Recommended cards:

- [`../tasks/cards/done/0256-content-and-discover-expansion-posture.md`](../tasks/cards/done/0256-content-and-discover-expansion-posture.md)

### 2. Richer Account And Relationship Flows

Possible expansions:

- stronger relation graph workflows
- clearer asset, membership, and entitlement history
- more explicit security-center and abnormal-login follow-up
- more complete account merge and recovery posture

The rule is to keep account as the canonical user workspace rather than introducing disconnected user-detail surfaces too early.

Recommended cards:

- [`../tasks/cards/done/0257-account-and-relationship-expansion-posture.md`](../tasks/cards/done/0257-account-and-relationship-expansion-posture.md)

### 3. Better Host Capability Experience

Possible expansions:

- more explicit degraded-mode UX contracts
- stronger capability diagnostics and fallback guidance
- richer payment, share, and upload host-runtime reporting

The rule is to keep capability state normalized in shared code while leaving runtime differences in `packages/platform-*`.

Recommended cards:

- [`../tasks/cards/done/0258-host-capability-experience-hardening.md`](../tasks/cards/done/0258-host-capability-experience-hardening.md)

## Detailed Expansion Backlog

The items below are a more complete future-facing candidate list. They are intentionally narrower than a product wish list and should still follow the current kernel boundary. None of them automatically outrank the `P0` release queue.

### Auth And Identity

1. device-trust scoring for repeated login and refresh activity
2. abnormal-login review lanes with clearer operator follow-up posture
3. stronger account-recovery and merge-decision evidence inside the shared identity workflow
4. OAuth-provider capability matrices that make provider-specific gaps explicit without changing the shared auth envelope

### Account And Relationship

5. relation-list workspaces for following, followers, friends, blocked users, and remarks
6. richer account asset history, entitlement timeline, and balance change explanations
7. stronger security-center summaries for device history, rate limits, and audit prompts
8. bounded account-recovery and cancellation follow-up flows inside the shared account workspace

### Settings And Policy

9. clearer policy-source explanations for `effectivePolicy`, lock posture, and environment-driven restrictions
10. reusable notification-policy presets across account, messages, and feedback surfaces
11. stronger debug and experiment governance for production-safe settings exposure
12. more explicit weak-network, autoplay, and device-behavior policy summaries

### Messages And Feedback

13. delivery-attempt and fallback-reason summaries for notification channels
14. clearer customer-support thread posture shared between inbox and feedback follow-up
15. bounded message-template governance for subscription, SMS, email, and push channels
16. stronger feedback triage summaries, revisit posture, and operator-action audit visibility

### Payment And Commerce

17. richer payment callback diagnostics and reconciliation summaries in shared order detail
18. clearer renewal, cancellation, refund, and after-sales continuity for subscription products
19. stronger idempotency, duplicate-payment, and ledger-audit visibility in order-center surfaces
20. explicit commerce capability posture for native pay, H5 redirect, and degraded payment follow-up

### Upload And Share

21. richer upload-derived asset metadata such as variants, covers, duration, and review annotations
22. stronger upload governance summaries for retention, reference ownership, and cleanup state
23. clearer share-channel readiness summaries for short-link, poster, native share, and clipboard fallback
24. stronger attribution replay, return-recognition, and invite-binding diagnostics without widening the share model

### Content And Discover

25. recommendation-lane governance for editorial, ranking, premium, related, and continue-reading slots
26. richer moderation and review-queue posture for managed-content workflows inside discover
27. stronger content attachment and derived-asset summaries without introducing a second editorial stack
28. clearer discover filter persistence, domain switching, and grouped-result quality signals
29. bounded search-quality improvements for typo recovery, zero-result suggestions, and query reuse

### Runtime, Host Experience, And Ops

30. capability-health snapshots that summarize host readiness for payment, share, upload, clipboard, and location
31. deeper route-restore and deep-link certification across H5 and WeChat host families
32. stronger adapter observability and normalized degraded-mode summaries without leaking host APIs into shared code
33. repeatable remote evidence packs for preview and production verification runs
34. environment-drift comparison between local, preview, and production rollout posture

## Backlog Rules

Treat the detailed backlog as a candidate pool, not a commitment list.

1. prefer items that extend existing contracts and controllers additively
2. keep account, settings, discover, and media-tools on the current shared workspace posture unless a stronger boundary is proven
3. avoid creating a second content stack, a second user-detail stack, or host-only fallback systems for work that belongs in shared state
4. if a candidate requires a new host family, dedicated console, or new top-level package, move it into the scope-decision bucket first

## New Task-Card Batch

These backlog areas are now split into a first task-card batch under `0259+`:

- [`../tasks/cards/done/0259-auth-risk-and-identity-governance-hardening.md`](../tasks/cards/done/0259-auth-risk-and-identity-governance-hardening.md)
  Covers backlog items `1` to `4`.
- [`../tasks/cards/done/0260-account-relationship-workspace-expansion.md`](../tasks/cards/done/0260-account-relationship-workspace-expansion.md)
  Covers backlog items `5` to `8`.
- [`../tasks/cards/done/0261-settings-policy-and-governance-expansion.md`](../tasks/cards/done/0261-settings-policy-and-governance-expansion.md)
  Covers backlog items `9` to `12`.
- [`../tasks/cards/done/0262-message-delivery-and-support-loop-hardening.md`](../tasks/cards/done/0262-message-delivery-and-support-loop-hardening.md)
  Covers backlog items `13` to `16`.
- [`../tasks/cards/active/0263-payment-commerce-diagnostics-and-continuity.md`](../tasks/cards/active/0263-payment-commerce-diagnostics-and-continuity.md)
  Covers backlog items `17` to `20`.
- [`../tasks/cards/active/0264-upload-governance-and-derived-asset-metadata.md`](../tasks/cards/active/0264-upload-governance-and-derived-asset-metadata.md)
  Covers backlog items `21` to `22`.
- [`../tasks/cards/active/0265-share-channel-readiness-and-attribution-hardening.md`](../tasks/cards/active/0265-share-channel-readiness-and-attribution-hardening.md)
  Covers backlog items `23` to `24`.
- [`../tasks/cards/active/0266-content-recommendation-and-moderation-governance.md`](../tasks/cards/active/0266-content-recommendation-and-moderation-governance.md)
  Covers backlog items `25` to `27`.
- [`../tasks/cards/active/0267-discover-search-quality-and-persistence.md`](../tasks/cards/active/0267-discover-search-quality-and-persistence.md)
  Covers backlog items `28` to `29`.
- [`../tasks/cards/active/0268-capability-health-and-host-readiness-snapshots.md`](../tasks/cards/active/0268-capability-health-and-host-readiness-snapshots.md)
  Covers backlog item `30`.
- [`../tasks/cards/active/0269-route-restore-and-deep-link-certification.md`](../tasks/cards/active/0269-route-restore-and-deep-link-certification.md)
  Covers backlog item `31`.
- [`../tasks/cards/active/0270-adapter-observability-and-environment-drift-audit.md`](../tasks/cards/active/0270-adapter-observability-and-environment-drift-audit.md)
  Covers backlog items `32` to `34`.

## Priority 3: Expansion Requiring A Scope Decision

These directions are plausible, but they are not automatic next steps.

### 1. New Platform Targets

Examples:

- Douyin
- Alipay
- native app shells

Only start this when:

- the current H5 and WeChat contracts are stable enough to reuse
- platform capability gaps are explicit
- host wiring and scaffold expectations are documented for the new family

### 2. Stronger Kernel Abstractions

Examples:

- formal telemetry abstraction
- formal lifecycle abstraction
- broader capability abstraction
- stronger host-generic UI shell or layout contracts

Only start this when repeated use across more than one official host or product line justifies the abstraction.

### 3. Dedicated Operational Or Editorial Consoles

Examples:

- separate CMS or moderation host
- dedicated operations console
- dedicated customer-service tooling

Only start this when the current bounded discover, feedback, inbox, and account surfaces are no longer sufficient and the new console has a clear ownership model.

## Expansion Rules

Future work should keep following these rules:

1. stabilize and extend existing shared contracts before creating new wrappers
2. prefer shared controller and protocol work before host-local duplication
3. keep provider rollout explicit instead of simulating completeness in sample mode
4. document intentional exceptions and rollout gaps in the tracked docs
5. do not add new top-level packages or platform families without a written reason

## Recommended Execution Order

Use this order after the current `P0` release queue closes:

1. [`../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md`](../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md)
   Stabilize the provider-backed production path first so later hardening work builds on a clearer operational baseline.
2. [`../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md`](../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md)
   Tighten release and evidence automation after provider posture is clearer, so verification reflects the real rollout model.
3. [`../tasks/cards/done/0255-shared-contract-governance-hardening.md`](../tasks/cards/done/0255-shared-contract-governance-hardening.md)
   Harden canonical output and protocol-governance rules once release-facing verification is more stable.
4. [`../tasks/cards/done/0256-content-and-discover-expansion-posture.md`](../tasks/cards/done/0256-content-and-discover-expansion-posture.md)
   Define the next safe content-growth posture after contract governance is clearer.
5. [`../tasks/cards/done/0257-account-and-relationship-expansion-posture.md`](../tasks/cards/done/0257-account-and-relationship-expansion-posture.md)
   Expand account and relationship planning after the account workspace and contract-governance posture are stable.
6. [`../tasks/cards/done/0258-host-capability-experience-hardening.md`](../tasks/cards/done/0258-host-capability-experience-hardening.md)
   Run capability-experience hardening after the provider-backed flows and shared capability boundaries are easier to verify.

## Parallelism Notes

- `0253` should start first because it clarifies production posture for several later slices.
- `0254` and `0255` may overlap once `0253` establishes the updated provider and rollout assumptions.
- `0256` and `0257` are the best parallel pair after `0255`, because one focuses on content/discover and the other on account/workspace growth.
- `0258` can overlap the tail of `0256` or `0257` if the capability boundary work does not compete for the same files, but it should not begin before `0253`.

## Owner Checklist

Use this checklist to assign the post-release queue by function instead of by card number only.

### Product

- confirm which post-release hardening outcomes are release quality work versus true product-surface expansion
- approve any explicit exception that would break the current account-workspace or discover-centered posture
- sign off on any future scope decision around new platform families, dedicated consoles, or stronger kernel abstractions

### Backend

- own [`../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md`](../tasks/cards/done/0253-provider-adapters-and-ops-hardening.md)
- own the API-side parts of [`../tasks/cards/done/0255-shared-contract-governance-hardening.md`](../tasks/cards/done/0255-shared-contract-governance-hardening.md)
- support the content/discover and account-growth posture work in [`../tasks/cards/done/0256-content-and-discover-expansion-posture.md`](../tasks/cards/done/0256-content-and-discover-expansion-posture.md) and [`../tasks/cards/done/0257-account-and-relationship-expansion-posture.md`](../tasks/cards/done/0257-account-and-relationship-expansion-posture.md)

### Frontend

- own host-visible verification and evidence improvements in [`../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md`](../tasks/cards/done/0254-verification-and-evidence-automation-hardening.md)
- help enforce shared-controller and protocol posture in [`../tasks/cards/done/0255-shared-contract-governance-hardening.md`](../tasks/cards/done/0255-shared-contract-governance-hardening.md)
- own shared feature and host-runtime aspects of [`../tasks/cards/done/0256-content-and-discover-expansion-posture.md`](../tasks/cards/done/0256-content-and-discover-expansion-posture.md), [`../tasks/cards/done/0257-account-and-relationship-expansion-posture.md`](../tasks/cards/done/0257-account-and-relationship-expansion-posture.md), and [`../tasks/cards/done/0258-host-capability-experience-hardening.md`](../tasks/cards/done/0258-host-capability-experience-hardening.md)

### Release

- keep release-facing evidence expectations synchronized while `0253` and `0254` evolve the ops and verification posture
- ensure post-release hardening does not silently weaken the current release gate or provider-failure posture
- carry forward any accepted deferred issues or new rollout rules into release docs only when they become explicit repo policy

## Handoff Points

- Product to Backend:
  confirm which hardening work is still inside the current product posture and which change would require an explicit scope decision.
- Backend to Frontend:
  confirm final shared envelopes, rollout diagnostics, and degraded-mode expectations before frontend compensates in host code.
- Frontend to Release:
  provide any new verification expectations, host-visible fallback rules, or evidence requirements that should affect release documents.
- Release to Product:
  surface when a proposed hardening slice is actually becoming a new scope decision rather than a safe post-release improvement.

## Not Next

The following are still poor next steps for this repository:

- broad view-layer unification
- large host-local UI abstraction layers
- new top-level catch-all shared packages
- feature breadth unrelated to the current official sample surface
- hiding production gaps behind sample-mode defaults
