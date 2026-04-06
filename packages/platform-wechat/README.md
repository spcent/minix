# Platform WeChat

WeChat runtime adapters for MiniX `v1.0`.

## Notes

- request, router, storage, auth, and UI adapters are thin wrappers over the host `wx` runtime APIs
- timeout, modal, loading, and navigation semantics are delegated to the Mini Program environment and normalized into MiniX result types
- intentional platform differences should stay explicit here instead of being hidden in host code
