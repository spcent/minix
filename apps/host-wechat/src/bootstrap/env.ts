import type { RuntimeEnv } from "@minix/core";

export interface HostWechatBootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const HOST_WECHAT_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const HOST_WECHAT_MOCK_API_BASE_URL = "https://mock.minix.local";

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

function readOverride(): HostWechatBootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: HostWechatBootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadHostWechatEnv(): RuntimeEnv {
  const override = readOverride();
  const useMock = override?.useMock ?? parseBooleanFlag(readProcessEnv("MINIX_USE_MOCK")) ?? false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readProcessEnv("MINIX_API_BASE_URL") ??
    (useMock ? HOST_WECHAT_MOCK_API_BASE_URL : HOST_WECHAT_DEFAULT_API_BASE_URL);

  return {
    appId: "host-wechat",
    appName: "MiniX Host Wechat",
    platform: "wechat",
    apiBaseUrl,
    debug: useMock,
    version: "0.1.0",
  };
}
