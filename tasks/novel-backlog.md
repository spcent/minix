# Novel Backlog

Last updated: 2026-04-03

This backlog starts from the current novel baseline:

- H5 has a full novel demo flow: `home`, `login`, `catalog`, `novelDetail`, `toc`, `reader`, `bookshelf`, `settings`, `membership`
- WeChat mirrors the same route set through generated shells and shared feature controllers
- membership purchase, bookshelf mutation, reader continuity, recommendation reasons, and reading-center preferences are already implemented

## v1.0 Sample Boundary

The novel apps are part of the frozen `v1.0` official sample surface, but the following behaviors remain sample-local rather than shared MiniX kernel guarantees:

- editorial storefront programming in `home` and `catalog`
- bookshelf grouping, pinning, and update-lane logic
- membership entitlement copy, purchase-return flows, and blocked-surface CTA orchestration
- reader continuity cues, milestone history, completion feedback, and reading-center posture language

Candidate post-`v1.0` extraction work should stay narrow:

- only extract an entitlement or continuity primitive if another non-novel sample genuinely needs it
- keep product-specific copy systems, merchandising lanes, and reading-center narratives inside the novel sample line

The tasks below focus only on the next layer of product quality and interaction depth.

## P1

### P1-1 WeChat reader and membership interaction parity

Summary:
Bring WeChat `novelDetail`, `toc`, `reader`, and `membership` feedback states closer to the H5 experience.

Goal:
Make the Mini Program feel like a real product surface instead of a thinner shell around shared controllers.

Scope:
- In scope:
  - richer locked, trial, and unlocked feedback states in WeChat `detail`, `toc`, `reader`, and `membership`
  - clearer completion, continue, and return actions inside the WeChat reader shell
  - unified membership intercept copy across `detail`, `toc`, and `reader`
- Out of scope:
  - new routes
  - new feature packages

Affected Paths:
- `packages/tooling/src/host-wechat-shells.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/subscription/src/controller/index.ts`

Acceptance:
- [ ] WeChat `detail -> toc -> reader -> membership -> return` feels coherent
- [ ] locked, trial, and purchased states use consistent wording and actions
- [ ] chapter completion and return actions are visible without relying on H5-specific layout patterns
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P1-2 Membership state and entitlement unification

Summary:
Tighten the membership model so all hosts consume one explicit entitlement story.

Goal:
Remove weak CTA branching based on partial flags and make guest, signed-in, chapter-unlocked, title-unlocked, and member states predictable.

Scope:
- In scope:
  - unify CTA rules across `detail`, `reader`, `toc`, and `membership`
  - make `tier` and `entitlementScope` drive copy and actions everywhere
  - clarify purchase success and return language for each blocked surface
- Out of scope:
  - real payments
  - account billing history

Affected Paths:
- `packages/contracts/src/api/membership.ts`
- `packages/features/subscription/src/controller/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/membership.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] all protected novel surfaces derive CTA text from one entitlement model
- [ ] purchase success copy explains exactly what was unlocked and where the return path goes
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P1-3 Reader save, completion, and session feedback polish

Summary:
Make reader progress persistence and chapter completion feedback more explicit to the user.

Goal:
Turn reader continuity from “it works” into “it feels reliable”.

Scope:
- In scope:
  - explicit “saved just now” or “last saved” UI
  - stronger completed-chapter summary before or while continuing
  - clearer distinction between reading, completed, and continued states
- Out of scope:
  - analytics backend
  - social reading features

Affected Paths:
- `packages/features/reader/src/model/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] reader clearly exposes session state and save recency
- [ ] chapter completion feedback survives chapter hops cleanly
- [ ] H5 and WeChat both expose the same reading-state semantics
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

## P2

### P2-1 Bookshelf as a reading control center

Summary:
Push bookshelf beyond sorting and pinning into a real reading control surface.

Goal:
Help users understand what to resume, what updated, and what has already been completed without scanning the whole shelf.

Scope:
- In scope:
  - stronger active, updated, completed overview cards
  - pinned lane with clearer rationale
  - “because you paused here” and “updated since last session” cues
  - optional lightweight groups such as frontlist, archive, or premium
- Out of scope:
  - collaborative shelves
  - cloud collections

Affected Paths:
- `packages/features/bookshelf/src/model/index.ts`
- `packages/features/bookshelf/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/bookshelf.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] bookshelf surfaces explain why each primary lane is shown
- [ ] pinned titles have a clear first-class presentation
- [ ] grouped counts and lane labels remain shared-state driven
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P2-2 Home and catalog recommendation lanes

Summary:
Expand recommendation reasons into more product-like home and catalog programming.

Goal:
Make every major card lane answer “why am I seeing this now?”

Scope:
- In scope:
  - `Recently updated on your shelf`
  - `Because you read...`
  - membership-aware merchandising lane
  - stronger frontlist editorial explanations
- Out of scope:
  - ML ranking
  - remote experimentation infrastructure

Affected Paths:
- `packages/contracts/src/api/novels.ts`
- `packages/features/catalog/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/home.ts`
- `apps/novel-h5/src/render/pages/catalog.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] home and catalog expose multiple recommendation lanes with distinct reasons
- [ ] reasons are shared-data driven, not page-only copy
- [ ] H5 and WeChat stay aligned on surfaced lane meaning
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P2-3 Reading center expansion

Summary:
Grow settings from a reading-center shell into a fuller reading operations page.

Goal:
Let users control not only display and continuity, but also reminder and session posture.

Scope:
- In scope:
  - update reminders
  - digest cadence detail
  - night mode default
  - resume strategy detail
  - device-first vs cross-host sync posture copy and controls
- Out of scope:
  - push notification delivery backend
  - account management and billing

Affected Paths:
- `packages/features/settings/src/model/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/settings.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] settings clearly reads as a reading-center surface, not only a display-preferences page
- [ ] newly added controls persist through shared storage-backed settings state
- [ ] reader and bookshelf behaviors can consume the updated settings model
- [ ] `pnpm gen:manifests`
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

## P3

### P3-1 Detail dossier follow-up

Summary:
Push the title detail page from “good dossier” to “fully persuasive dossier”.

Goal:
Increase trust and clarity before reading, shelving, or purchasing.

Scope:
- In scope:
  - richer update history cues
  - stronger author presence
  - clearer trial rules and access explanation
  - expanded related-title framing
- Out of scope:
  - comments or social proof systems with real moderation

Affected Paths:
- `packages/contracts/src/api/novel-detail.ts`
- `apps/novel-h5/src/bootstrap/mock-api.ts`
- `apps/novel-wechat/src/bootstrap/mock-api.ts`
- `apps/novel-h5/src/render/pages/novel-detail.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] detail gives a clearer reason to start, continue, shelf, or unlock
- [ ] access rules and reputation signals do not conflict
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P3-2 Reader and TOC structural polish

Summary:
Polish deep reading behavior so long sessions feel quieter and more stable.

Goal:
Reduce friction during extended reading sessions and chapter navigation.

Scope:
- In scope:
  - TOC volume folding or grouping
  - stronger active chapter jump-back
  - cleaner session transition wording
  - smoother reader panel hierarchy
- Out of scope:
  - virtualization or large-scale performance work unless required

Affected Paths:
- `packages/features/reader/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `apps/novel-h5/src/render/components/reader-panels.ts`
- `apps/novel-h5/src/render/pages/toc.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `packages/tooling/src/host-wechat-shells.ts`

Acceptance:
- [ ] TOC and reader stay visually and semantically in sync over long sessions
- [ ] current chapter recovery feels immediate and obvious
- [ ] `pnpm gen:shells`
- [ ] `pnpm verify`

### P3-3 Test and documentation reinforcement

Summary:
Keep novel behavior easy to evolve by tightening test coverage and product-facing documentation.

Goal:
Reduce regression risk as the novel line grows past the current demo milestone.

Scope:
- In scope:
  - regression coverage for membership return paths
  - regression coverage for settings-to-reader live apply
  - regression coverage for bookshelf grouping and pinning
  - keep README and backend contract docs aligned when behavior changes
- Out of scope:
  - external documentation site work

Affected Paths:
- `packages/features/**/*.test.ts`
- `apps/**/*.test.ts`
- `apps/novel-h5/README.md`
- `apps/novel-wechat/README.md`
- `docs/BACKEND_CONTRACT.md`

Acceptance:
- [ ] high-risk novel flows have focused regression coverage
- [ ] docs stay aligned with the actual host and contract behavior
- [ ] `pnpm verify`, or skipped with reason if docs-only
