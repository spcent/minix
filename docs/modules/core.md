# Core Module

Path: `packages/core`

Use this package for:

- ports and adapter contracts
- runtime orchestration
- shared store primitives
- shared error and result types

Core must stay independent from features, platforms, and host apps. It provides the stable base that features and platforms plug into.

Core code must not call `wx.*` or `window.*` directly.
