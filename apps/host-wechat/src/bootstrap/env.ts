import { createBootstrapRuntimeEnv, type BootstrapRuntimeEnvOverride, type RuntimeEnv } from "@minix/core";

export type HostWechatBootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const HOST_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const HOST_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

export function loadHostWechatEnv(): RuntimeEnv {
  return createBootstrapRuntimeEnv({
    appId: "host-wechat",
    appName: "MiniX Host Wechat",
    platform: "wechat",
    defaultApiBaseUrl: HOST_WECHAT_DEFAULT_API_BASE_URL,
    mockApiBaseUrl: HOST_WECHAT_MOCK_API_BASE_URL,
    version: "1.0.0",
  });
}
