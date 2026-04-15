# Architecture Overview

MiniX is a small, agent-friendly application kernel for WeChat Mini Program and H5.

The kernel started from one narrow shared path:

`login -> /auth/login -> protected /items -> settings -> logout`

The current repository is now frozen around the `v1.0.0` official sample surface:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`
- `apps/api` as the shared sample backend for those hosts

The repository favors:

- explicit package boundaries
- platform-specific adapters over shared platform assumptions
- manifest- and registry-driven host wiring
- small, verifiable changes that are safe for agents to make

MiniX does not try to unify view rendering across platforms. Shared code owns business flow, state, contracts, and runtime orchestration. Platform packages and host apps own the platform-facing integration.

Related references:

- [Architecture Summary](../ARCHITECTURE.md)
- [Layer Model](./layers.md)
- [Host Wiring](./host-wiring.md)
