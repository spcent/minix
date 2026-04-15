# Tooling Module

Path: `packages/tooling`

Use this package for:

- scaffold entry points such as `scaffold:feature` and `scaffold:page`
- host manifest compilation and typed manifest helpers
- H5 renderer registry generation helpers
- WeChat shell synchronization helpers
- repo-facing spec and wiring utilities used by scripts

Prefer extending this package when the repository needs new scaffolded or generated behavior. Do not spread host-manifest compilation logic across ad hoc scripts or host apps.
