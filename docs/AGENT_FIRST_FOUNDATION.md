# MiniX Agent-First Foundation

本文不是对 `v0.1` 的补丁建议，而是站在“不考虑兼容”的前提下，为 MiniX 设计下一阶段的目标工程骨架。

目标只有一个:

`让 agent 能够低认知负担地定位、修改、验证和扩展代码，并且随着功能增长仍然保持可持续。`

## 1. 先说结论

当前仓库已经具备正确方向:

- 有 monorepo
- 有 contracts / core / platform 分层
- 有明确的 host 闭环
- 有文档化的边界意识

但它还不是“极其 agent 友好”的结构，核心原因是:

1. 共享逻辑仍然主要存在于 `apps/*`，而不是稳定的 feature 包。
2. 约束主要写在文档里，没有被目录、依赖关系和脚本入口强制执行。
3. 运行时装配分散在多个文件，新增一个功能会跨很多位置改动。
4. WeChat/H5 之间存在成对复制的 controller/model/runtime/routes，agent 很难判断“应该抽象还是继续复制”。
5. 仓库缺少“单一事实来源”:
   - 路由定义分散
   - 页面注册分散
   - feature 装配分散
   - mock/contract/test fixture 分散

如果继续在现有骨架上增量扩展，后面会出现两个问题:

- agent 修改一个功能时触点太多，回归风险上升
- 架构规则越来越依赖人脑记忆，而不是工程系统本身

所以建议下一阶段直接从“kernel + platform + host app”升级为:

`contracts + core runtime + features + platforms + hosts + tooling`

## 2. 现状里最影响 agent 效率的点

### 2.1 业务逻辑放在 app 内，而不是 feature 内

现在 `apps/host-wechat/src/registrations/pages/*` 和 `apps/host-h5/src/registrations/pages/*` 内仍然保留了一层页面级包装。

这会导致:

- agent 新增一个业务能力时，不知道应该先改共享层还是先改某个 host
- 同一个 feature 在不同 app 下有平行实现，容易继续复制
- host 目录逐渐演变成真实业务目录，失去“壳层”职责

### 2.2 平台差异和业务差异没有被彻底拆开

例如 list/login/settings 这种功能，真正的业务流程应该共享，但目前很多 controller 仍然跟平台路由常量、UI 行为绑定。

这会导致:

- “业务逻辑共享”被“平台跳转路径不同”打断
- agent 做抽象时容易把平台细节带回共享层

### 2.3 装配入口不够集中

一个完整功能链路目前会散落在:

- `src/bootstrap/providers.ts`
- `src/bootstrap/runtime.ts`
- `src/registrations/page-entries.ts`
- `src/manifest/routes.ts`
- `src/registrations/wechat/*`
- `miniprogram/pages/*`

这对人类还能跟，但对 agent 来说，修改范围判断成本偏高。

### 2.4 文档规则没有变成“硬约束”

当前边界主要通过:

- `docs/ARCHITECTURE.md`
- `docs/AGENT_GUIDE.md`

来表达。

这不够。agent 友好的关键不是“文档写清楚”，而是:

- 目录天然表达边界
- 依赖关系天然不允许越界
- CI 和本地脚本可以直接拦截越界

### 2.5 没有 feature 级测试闭环

现在测试更多是 package 级和 app 级。

agent 更适合的验证单元应该是:

- 一个 feature 的用例测试
- 一个 feature 的 contract 测试
- 一个 platform adapter 的兼容测试
- 一个 host app 的装配测试

这样改动影响范围更容易判断。

## 3. 目标架构原则

下一阶段建议固定 6 条原则。

### 3.1 Host 要尽量薄

`apps/*` 只能做:

- 平台启动入口
- 壳层配置
- 资源文件
- 页面/路由注册
- feature 装配

不能再承载核心业务逻辑。

### 3.2 Feature 要成为第一组织单元

以后不是先想“这个页面放哪个 app”，而是先想:

`这属于哪个 feature 包。`

例如:

- `feature-auth`
- `feature-items`
- `feature-settings`

feature 内聚:

- state
- use case
- controller
- contract
- mock fixture
- tests

### 3.3 Platform 只负责宿主映射

平台层只做:

- host API adapter
- view binding
- route mapping
- page/app bridge

平台层不写业务流程。

### 3.4 Contracts 要独立成稳定层

所有会被多处引用、且应该长期稳定的对象单独抽出:

- backend contract
- route id
- session shape
- result/error codes
- feature capability flags
- test fixture schema

这样 agent 改功能时能先锁定“协议面”。

### 3.5 Runtime 装配必须单点化

一个 host app 最终应该只有一个清晰的装配入口，例如:

- `app.manifest.ts`
- `runtime/create-app.ts`

agent 要能从一个地方看清楚:

- 这个 app 启用了哪些 feature
- 用了哪些 adapter
- 路由怎么映射
- mock 是否开启

### 3.6 每个目录都要有明确的“允许依赖方向”

这件事必须硬编码到工程里，而不是只写在文档中。

## 4. 推荐的目标目录

建议直接重组为下面这个形态:

```text
minix/
├─ apps/
│  ├─ host-wechat/
│  │  ├─ miniprogram/
│  │  └─ src/
│  │     ├─ bootstrap/
│  │     ├─ manifest/
│  │     └─ registrations/
│  └─ host-h5/
│     ├─ public/
│     └─ src/
│        ├─ bootstrap/
│        ├─ manifest/
│        └─ render/
│
├─ packages/
│  ├─ contracts/
│  │  └─ src/
│  │     ├─ api/
│  │     ├─ errors/
│  │     ├─ routes/
│  │     ├─ session/
│  │     └─ feature-flags/
│  │
│  ├─ core/
│  │  └─ src/
│  │     ├─ kernel/
│  │     ├─ runtime/
│  │     ├─ store/
│  │     ├─ effect/
│  │     └─ ports/
│  │
│  ├─ features/
│  │  ├─ auth/
│  │  │  └─ src/
│  │  │     ├─ contract/
│  │  │     ├─ model/
│  │  │     ├─ controller/
│  │  │     ├─ use-cases/
│  │  │     ├─ routes/
│  │  │     ├─ mocks/
│  │  │     └─ tests/
│  │  ├─ items/
│  │  └─ settings/
│  │
│  ├─ platform-wechat/
│  │  └─ src/
│  │     ├─ adapters/
│  │     ├─ bridge/
│  │     ├─ view-bindings/
│  │     └─ route-mapper/
│  │
│  ├─ platform-h5/
│  │  └─ src/
│  │     ├─ adapters/
│  │     ├─ renderer/
│  │     ├─ view-bindings/
│  │     └─ route-mapper/
│  │
│  ├─ testkit/
│  │  └─ src/
│  │     ├─ fakes/
│  │     ├─ fixtures/
│  │     ├─ host-harness/
│  │     └─ assertions/
│  │
│  └─ tooling/
│     └─ src/
│        ├─ manifests/
│        ├─ generators/
│        ├─ checks/
│        └─ scripts/
│
├─ docs/
│  ├─ architecture/
│  ├─ decisions/
│  ├─ specs/
│  └─ agents/
│
├─ .github/
│  └─ workflows/
│
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## 5. 每层职责和依赖方向

建议把依赖规则固定成这样:

### 5.1 `apps/*`

允许依赖:

- `packages/features/*`
- `packages/platform-*`
- `packages/core`
- `packages/contracts`

禁止依赖:

- 其他 app
- feature 的内部文件深链路导入

### 5.2 `packages/platform-*`

允许依赖:

- `packages/core`
- `packages/contracts`
- `packages/features/*` 的公开 view binding contract

禁止依赖:

- host app
- feature 内部 use case

### 5.3 `packages/features/*`

允许依赖:

- `packages/core`
- `packages/contracts`

禁止依赖:

- 任何 platform 包
- 任何 app
- 其他 feature 的内部实现

### 5.4 `packages/core`

允许依赖:

- `packages/contracts`

禁止依赖:

- feature
- platform
- app

### 5.5 `packages/contracts`

只能被依赖，不能依赖业务代码。

这条规则很重要，因为 contracts 是 agent 最容易拿来做“变更边界判断”的稳定锚点。

## 6. 关键设计调整

### 6.1 把共享运行时明确收敛在 `core`

当前仓库已经把共享运行时收敛到了 `packages/core`，但内部结构仍然需要继续清晰化:

- `ports`: 宿主能力接口
- `runtime`: 装配和生命周期
- `store`: 状态容器
- `kernel`: 真正的共享基础服务

不要继续把所有概念都放进一个巨型 `index.ts` 聚合出口。

### 6.2 路由不要按平台常量维护，改成 route id + 平台映射

当前像:

- WeChat 用 `/pages/login/index`
- H5 用 `/login`

这种差异不应该进入 feature controller。

建议改为:

```ts
export const routeIds = {
  login: "auth.login",
  items: "items.list",
  settings: "settings.index",
} as const;
```

feature/controller 只依赖 `routeIds`，平台层负责映射:

- WeChat: `auth.login -> /pages/login/index`
- H5: `auth.login -> /login`

这样 controller 才能真正共享。

### 6.3 把 controller 从“页面 controller”升级为“feature controller”

现在 controller 仍然强绑定页面。

建议以后 feature 包暴露的是:

- controller factory
- state model
- actions
- route contract

平台只是把这些 actions 绑定到 view 事件上。

### 6.4 把 mock 从 app 层下沉到 feature/testkit

现在 mock API 更像 host 层资产。

如果目标是 agent 高效迭代，mock 应该更靠近 feature contract:

- feature fixture
- feature mock handler
- host app 只负责组合这些 mock

### 6.5 页面注册改为 manifest 驱动

现在页面注册分散在 runtime/page-entry/wechat shell。

建议改成 manifest:

```ts
export const appManifest = {
  features: [authFeature, itemsFeature, settingsFeature],
  routes: [...],
  platform: "wechat",
  mock: true,
} as const;
```

agent 修改功能时优先改 manifest 和 feature，而不是在多个 wiring 文件中来回跳转。

### 6.6 引入公开 API 边界

每个 package 只允许通过固定入口导出:

- `src/index.ts`
- `src/public/*.ts`

禁止跨包导入内部路径，例如:

`@minix/feature-auth/src/use-cases/login`

否则 agent 很快会把内部结构耦合死。

## 7. 对 agent 最重要的配套工程化

### 7.1 用校验代替口头约束

必须补上:

- import boundary check
- circular dependency check
- unused export check
- generated file guard
- public API guard

即使先不引入复杂工具，也至少要有脚本能检查:

- app 不导入 platform 内部实现
- feature 不导入 `wx.*` 相关模块
- contracts 不反向依赖其他层

### 7.2 固定任务入口

agent 最怕“一件事有很多运行方式”。

建议脚本体系标准化成:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:features`
- `pnpm test:platforms`
- `pnpm build`
- `pnpm dev:host-h5`
- `pnpm verify`
- `pnpm verify:full`
- `pnpm scaffold:feature <name>`

### 7.3 给 agent 一份真正可执行的开发地图

建议在仓库根部增加:

- `docs/agents/WORKFLOW.md`
- `docs/agents/BOUNDARIES.md`
- `docs/agents/FILE_MAP.md`
- `docs/agents/CHANGE_PLAYBOOK.md`

内容不要写概念，要写:

- 改某类需求先看哪些目录
- 改 feature 时必须补哪些测试
- 哪些文件可以改，哪些文件禁止手改

### 7.4 生成物和源码彻底分离

像 `apps/host-h5/dist` 这种产物不应该长期参与源码思考。

agent 友好的原则是:

- 生成物默认不入版本库
- 如果必须保留，也放在明确的 generated 目录并带说明

## 8. 推荐的测试结构

测试按四层组织:

### 8.1 Contract tests

验证:

- API shape
- error code
- route id
- session schema

### 8.2 Feature tests

验证:

- controller action
- store state transition
- use case behavior

### 8.3 Platform tests

验证:

- adapter compatibility
- route mapping
- view binding
- bridge lifecycle

### 8.4 Host assembly tests

验证:

- manifest 装配
- feature 启用关系
- mock/runtime wiring

这样 agent 每次改动都能很快找到最小验证集。

## 9. 推荐的落地顺序

如果从当前仓库重构，建议按下面顺序推进。

### Phase 1: 先重组目录，不扩功能

目标:

- 建立 `contracts / core / features / platforms / hosts / testkit`
- 让目录本身表达边界

### Phase 2: 把 login/list/settings 拆成 feature

目标:

- 从 `apps/host-*` 中抽离 controller/model/use case
- host app 只保留装配和注册

### Phase 3: 路由改成 route id + mapper

目标:

- controller 完全摆脱平台路径
- 真正实现跨端共享流程

### Phase 4: manifest 驱动 runtime

目标:

- app 入口收敛成单点装配
- feature 开关、mock、route 注册一处可见

### Phase 5: 用检查脚本封死架构回退

目标:

- 任何越界导入、错误分层、错误装配都能被 CI 拦截

## 10. 最终判断

如果目标是“整个工程完全采用 agent 驱动开发”，那么 MiniX 下一阶段最应该做的不是继续扩 core，也不是继续补 host 页面，而是把工程组织方式改成:

`feature-first, host-thin, contract-stable, manifest-driven, rule-enforced`

具体到这个仓库，最重要的 4 个动作是:

1. 把共享业务逻辑从 `apps/host-*` 抽到 `packages/features/*`
2. 把平台路由路径改成 `route id + mapper`
3. 把运行时装配收敛成 `manifest`
4. 把文档约束升级为脚本和 CI 的硬约束

这 4 件事做完，MiniX 才会从“对 agent 友好”进入“以 agent 为默认开发者”的状态。
