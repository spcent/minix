# MiniX 中文说明

MiniX 是一个面向 Agent 协作的小型跨端内核，当前聚焦 WeChat Mini Program 与 H5。

仓库最初从一条极窄的共享链路出发：

`login -> /auth/login -> protected /items -> settings -> logout`

现在仓库已经冻结在 `v1.0.0` 的官方 sample 面上，目标不是继续扩张成“大而全”的跨端框架，而是在清晰边界内把共享运行时、平台适配器、Host 接线和示例应用维护到可验证、可演进。

## 当前发布状态

当前仓库处于最终 `v1.0.0` 版本面，官方支持的 sample 应用包括：

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

同时，`apps/api` 提供这四个官方 sample 共用的后端与本地/Cloudflare Worker 运行入口。

## 仓库结构

- `apps/api`：示例后端，包含认证、内容、支付、分享、上传等领域路由
- `apps/host-wechat`：基础共享流的 WeChat Host
- `apps/host-h5`：基础共享流的 H5 Host
- `apps/novel-wechat`：小说示例的 WeChat Host
- `apps/novel-h5`：小说示例的 H5 Host
- `packages/contracts`：路由 id 与后端契约类型
- `packages/core`：共享 ports、runtime、store、错误与基础类型
- `packages/features/*`：平台无关的业务功能包
- `packages/platform-wechat`：WeChat 适配器与桥接
- `packages/platform-h5`：H5 适配器
- `packages/tooling`：脚手架、manifest 编译与 shell 生成工具
- `packages/testkit`：共享测试桩与测试辅助

## 设计原则

- 共享代码不能直接调用 `wx.*` 或 `window.*`
- 平台差异收敛在 `packages/platform-*` 或 Host App 内
- 预期失败统一走 `Result<T>`，不要到处抛异常
- Host 路由与页面接线保持 manifest / registry 驱动
- `apps/*/src/manifest/page-definitions.ts` 是 Host 页面定义的源文件
- 生成文件例如 `app.manifest.ts`、`page-registry.ts`、WeChat shell 产物都应重新生成，不应手改

## 快速开始

先在仓库根目录安装依赖：

```bash
pnpm install
```

执行主验证：

```bash
pnpm verify
```

启动本地 API：

```bash
pnpm dev:api
```

启动基础 H5 Host：

```bash
pnpm dev
```

访问 `http://localhost:4173`

启动小说 H5 Host：

```bash
pnpm dev:novel-h5
```

访问 `http://localhost:4174`

如果需要本地 Cloudflare Worker + D1 形态：

```bash
pnpm api:d1:migrate:local
pnpm dev:api:worker
```

## 常用命令

```bash
pnpm verify
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
pnpm verify:release
pnpm verify:h5:blackbox
pnpm verify:official-integrations
pnpm smoke:official-samples
pnpm dev:api
pnpm dev
pnpm dev:novel-h5
pnpm preview
pnpm preview:novel-h5
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

其中：

- `pnpm verify` 会跑规格、边界、契约、host 接线、类型检查和测试
- `pnpm verify:release` 用于四个官方 sample 的冻结发布面验证
- `workspace` 是上传/分享类能力特性的默认脚手架模板

## 推荐改动顺序

1. 只有共享接口真的变化时才改 `packages/contracts`
2. 先在 `packages/features/*` 实现或扩展业务逻辑
3. 平台行为不同，再改 `packages/platform-*`
4. 再更新 Host 的 manifest / registry 源文件
5. 最后重新生成 shell 或 manifest，并从仓库根目录执行验证

## 参考文档

- [README.md](./README.md)
- [docs/README.md](./docs/README.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/architecture/README.md](./docs/architecture/README.md)
- [docs/modules/README.md](./docs/modules/README.md)
- [docs/BACKEND_CONTRACT.md](./docs/BACKEND_CONTRACT.md)
- [docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md)
- [docs/RELEASE_RUNBOOK.md](./docs/RELEASE_RUNBOOK.md)
- [docs/AGENT_GUIDE.md](./docs/AGENT_GUIDE.md)
- [packages/features/README.md](./packages/features/README.md)

英文 `README.md` 仍然是最完整的发布与部署说明；本文件提供当前实现对应的中文总览，帮助快速理解仓库边界、结构和常用工作流。
