# Host Apps

Paths:

- `apps/host-wechat`
- `apps/host-h5`

Use host apps for:

- bootstrap composition
- host manifests
- page registrations
- render registries
- generated shell files and host-scanned assets

Host apps may depend on shared packages, but they should not become the home of shared business logic.

When adding a host-visible page, prefer:

1. scaffold the page entry when needed
2. wire it through host manifests and registries
3. keep business behavior inside a feature package

Related references:

- [Add Page Recipe](../../specs/change-recipes/add-page.md)
- [Host Wiring](../architecture/host-wiring.md)
