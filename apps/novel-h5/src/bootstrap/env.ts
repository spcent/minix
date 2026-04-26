import {
  createBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type NovelH5BootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const NOVEL_H5_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const NOVEL_H5_MOCK_API_BASE_URL = "https://mock.minix.local";

export function loadNovelH5Env(): RuntimeEnv {
  return createBootstrapRuntimeEnv({
    appId: "novel-h5",
    appName: "MiniX Novel H5",
    platform: "h5",
    defaultApiBaseUrl: NOVEL_H5_DEFAULT_API_BASE_URL,
    mockApiBaseUrl: NOVEL_H5_MOCK_API_BASE_URL,
    version: "1.0.0",
    allowLocationParams: true,
  });
}
