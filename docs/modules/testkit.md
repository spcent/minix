# Testkit Module

Path: `packages/testkit`

Use this package for:

- shared kernel stubs and test helpers reused across workspace packages
- common setup that keeps feature, core, and adapter tests small
- test-only utilities that should not leak into runtime packages

Keep this package lightweight and runtime-agnostic. If a helper becomes production behavior, move it into the appropriate runtime package instead of leaving it in testkit.
