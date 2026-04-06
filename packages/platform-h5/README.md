# Platform H5

Browser adapters for MiniX `v1.0`.

## Notes

- request uses `fetch` and now honors `timeoutMs` through `AbortController`
- UI feedback is no longer a no-op: toast and loading render minimal DOM overlays, and modal uses browser confirm semantics
- auth still supports the anonymous credential fallback for compatibility, but callers can now provide an explicit H5 credential or provider through the adapter API
