import { parseBootstrapBooleanFlag, readBootstrapProcessEnv, type RuntimeEnv } from "@minix/core";

export interface NovelWechatBootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const NOVEL_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const NOVEL_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

function readOverride(): NovelWechatBootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: NovelWechatBootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadNovelWechatEnv(): RuntimeEnv {
  const override = readOverride();
  const useMock = override?.useMock ?? parseBootstrapBooleanFlag(readBootstrapProcessEnv("MINIX_USE_MOCK")) ?? false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readBootstrapProcessEnv("MINIX_API_BASE_URL") ??
    (useMock ? NOVEL_WECHAT_MOCK_API_BASE_URL : NOVEL_WECHAT_DEFAULT_API_BASE_URL);

  return {
    appId: "novel-wechat",
    appName: "MiniX Novel Wechat",
    platform: "wechat",
    apiBaseUrl,
    debug: useMock,
    version: "1.0.0",
  };
}
