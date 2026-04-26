import { createBootstrapRuntimeEnv, type BootstrapRuntimeEnvOverride, type RuntimeEnv } from "@minix/core";

export type NovelWechatBootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const NOVEL_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const NOVEL_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

export function loadNovelWechatEnv(): RuntimeEnv {
  return createBootstrapRuntimeEnv({
    appId: "novel-wechat",
    appName: "MiniX Novel Wechat",
    platform: "wechat",
    defaultApiBaseUrl: NOVEL_WECHAT_DEFAULT_API_BASE_URL,
    mockApiBaseUrl: NOVEL_WECHAT_MOCK_API_BASE_URL,
    version: "1.0.0",
  });
}
