# WeChat Platform Module

Path: `packages/platform-wechat`

Use this package for:

- `wx.login`
- `wx.request`
- storage integration
- router integration
- UI bridge behavior such as loading, toast, and modal adapters
- `App()` and `Page()` bridge helpers

This layer translates WeChat APIs into the stable contracts defined by `packages/core`.

Business behavior should not migrate into this package unless the behavior is truly WeChat-specific.
