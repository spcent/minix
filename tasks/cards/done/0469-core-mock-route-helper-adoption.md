# 0469 Core Mock Route Helper Adoption

## 背景

四个官方 host 的 mock API adapter 已经复用 `@minix/core` 的 mock response、bearer auth、query coercion、pagination 等 helper，但仍然各自手写 mock route path 判断和 `NOT_FOUND` 错误构造。该重复会让后续产品矩阵接入 mock API 时复制分支条件和错误文案，降低一致性。

## 目标

- 在 core runtime mock request 工具中补齐无平台依赖的 route matching 和 route not found error helper。
- 将 host-h5、host-wechat、novel-h5、novel-wechat 的 mock adapter 迁移到统一 helper。
- 保持现有 mock API 行为、状态码、业务响应不变。
- 补充 core runtime 单测，覆盖 query path、method-sensitive matching 和 not found error shape。

## 验收

- `packages/core/src/runtime/mock-request.test.ts` 覆盖新增 helper。
- 四个官方 host mock adapter 不再重复手写基础 route match/not found 逻辑。
- 至少运行相关 host 验证；最终 closeout 前运行 `pnpm verify`。
