import type { RuntimeEnv } from "@minix/core";

export interface NovelWechatBootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const NOVEL_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const NOVEL_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

function parseBooleanFlag(value: string | boolean | null | undefined): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (!value) {
    return undefined;
  }

  switch (value.toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return undefined;
  }
}

function readProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env?.[name];
}

function readOverride(): NovelWechatBootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: NovelWechatBootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadNovelWechatEnv(): RuntimeEnv {
  const override = readOverride();
  const useMock = override?.useMock ?? parseBooleanFlag(readProcessEnv("MINIX_USE_MOCK")) ?? false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readProcessEnv("MINIX_API_BASE_URL") ??
    (useMock ? NOVEL_WECHAT_MOCK_API_BASE_URL : NOVEL_WECHAT_DEFAULT_API_BASE_URL);

  return {
    appId: "novel-wechat",
    appName: "MiniX Novel Wechat",
    platform: "wechat",
    apiBaseUrl,
    debug: useMock,
    version: "0.1.0",
  };
}
