import { parseBootstrapBooleanFlag, readBootstrapProcessEnv, type RuntimeEnv } from "@minix/core";

export interface HostWechatBootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const HOST_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const HOST_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

function readOverride(): HostWechatBootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: HostWechatBootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadHostWechatEnv(): RuntimeEnv {
  const override = readOverride();
  const useMock = override?.useMock ?? parseBootstrapBooleanFlag(readBootstrapProcessEnv("MINIX_USE_MOCK")) ?? false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readBootstrapProcessEnv("MINIX_API_BASE_URL") ??
    (useMock ? HOST_WECHAT_MOCK_API_BASE_URL : HOST_WECHAT_DEFAULT_API_BASE_URL);

  return {
    appId: "host-wechat",
    appName: "MiniX Host Wechat",
    platform: "wechat",
    apiBaseUrl,
    debug: useMock,
    version: "1.0.0",
  };
}
