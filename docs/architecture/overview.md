# Architecture Overview

MiniX is a small, agent-friendly application kernel for WeChat Mini Program and H5.

`v0.1` intentionally proves one shared path only:

`login -> /auth/login -> protected /items -> settings -> logout`

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
