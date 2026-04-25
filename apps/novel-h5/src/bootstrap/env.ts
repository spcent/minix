import {
  parseBootstrapBooleanFlag,
  readBootstrapLocationParam,
  readBootstrapProcessEnv,
  type RuntimeEnv,
} from "@minix/core";

export interface NovelH5BootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const NOVEL_H5_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const NOVEL_H5_MOCK_API_BASE_URL = "https://mock.minix.local";

function readOverride(): NovelH5BootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: NovelH5BootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadNovelH5Env(): RuntimeEnv {
  const override = readOverride();
  const useMock =
    override?.useMock ??
    parseBootstrapBooleanFlag(readBootstrapProcessEnv("MINIX_USE_MOCK")) ??
    parseBootstrapBooleanFlag(readBootstrapLocationParam("minix_use_mock")) ??
    false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readBootstrapProcessEnv("MINIX_API_BASE_URL") ??
    readBootstrapLocationParam("minix_api_base_url") ??
    (useMock ? NOVEL_H5_MOCK_API_BASE_URL : NOVEL_H5_DEFAULT_API_BASE_URL);

  return {
    appId: "novel-h5",
    appName: "MiniX Novel H5",
    platform: "h5",
    apiBaseUrl,
    debug: useMock,
    version: "1.0.0",
  };
}
