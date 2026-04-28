# 0470 Novel H5 DOM Binding Helper Adoption

## 背景

`apps/novel-h5/src/render/page-registry.ts` 中存在多处重复 DOM 查询、事件绑定、dataset 读取和 input value 读取逻辑。随着 novel H5 页面继续增加，这些手写绑定容易出现 selector 不一致、空值处理不一致和事件绑定样板膨胀。

## 目标

- 在 novel H5 渲染层新增小型 DOM binding/helper 模块，集中处理常见查询、点击绑定、输入读取。
- 迁移 page registry 中重复的 `querySelector(All)`/`addEventListener`/`dataset` 读取逻辑。
- 保持 helper 仅服务 H5 渲染层，不把 DOM 依赖放进 shared core。
- 不改变页面结构、controller 行为、路由、文案和数据展示。

## 验收

- `apps/novel-h5/src/render/page-registry.ts` 的绑定逻辑更短、更一致。
- 新 helper 有明确类型边界，可继续复用到后续 novel H5 页面。
- 运行 `pnpm verify:host novel-h5`；最终 closeout 前运行 `pnpm verify`。
