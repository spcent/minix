# Milestones

Use this folder for milestone-level planning before work is split into task cards.

The intended flow for larger iterations is:

`Milestone Spec`
-> `Planner`
-> `Interface Freeze`
-> `Task Decomposer`
-> `Worker execution`
-> `Integrator`
-> `Verifier`
-> `Human review`

## Why this exists

`tasks/cards/` is optimized for small executable slices.
This folder exists to define the shared boundary before multiple slices start moving in parallel.

For `minix`, this is especially important because:

- `packages/contracts` and `packages/core` are high-conflict shared surfaces
- `packages/features/*` should stay platform-agnostic
- host route wiring must stay manifest-driven
- generated host outputs must be regenerated, not treated as source files

## Rules

- one milestone file per product or architecture milestone
- name milestone files with a sortable milestone id prefix using `MNNN-short-name.md`
- write the milestone before creating task cards for the same body of work
- freeze shared interfaces before parallel work starts
- keep task cards scoped to disjoint write sets where possible
- assign one integrator to own manifest updates, generated outputs, and final verification
- move milestone notes forward by creating follow-up milestone files instead of overwriting history heavily

## Minimum Sections

Every milestone spec should include:

- `Summary`
- `Goal`
- `Non-goals`
- `Scope`
- `Affected Packages`
- `Route Impact`
- `Contract Impact`
- `Interface Freeze`
- `Execution Plan`
- `Verification Plan`
- `Acceptance`
- `Risks / Follow-ups`

## Relationship to Task Cards

- milestone specs define the boundary and execution shape
- task cards define the concrete slices to implement
- cards should reference the milestone file they belong to
- milestone review should happen on the integrated result, not one card at a time

## Recommended Usage

1. Write the milestone spec.
2. Decide whether contracts, feature state, or route params will change.
3. Freeze those interfaces.
4. Split the work into cards with explicit ownership.
5. Run worker slices in parallel only when write sets do not overlap.
6. Let one integrator regenerate host outputs and run final verification.

Start from [TEMPLATE.md](./TEMPLATE.md).
