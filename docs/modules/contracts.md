# Contracts Module

Path: `packages/contracts`

Use this package for:

- route ids
- backend request and response types
- shared payload types that cross feature boundaries

Do not put runtime orchestration, controllers, or platform calls here.

Change this package only when the shared surface actually changes. Contract edits are high-leverage because they affect both shared logic and host wiring.
