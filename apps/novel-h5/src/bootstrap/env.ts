import {
  DEFAULT_BOOTSTRAP_API_BASE_URL,
  DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL,
  createOfficialHostBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type NovelH5BootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const NOVEL_H5_DEFAULT_API_BASE_URL = DEFAULT_BOOTSTRAP_API_BASE_URL;
export const NOVEL_H5_MOCK_API_BASE_URL = DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL;

export function loadNovelH5Env(): RuntimeEnv {
  return createOfficialHostBootstrapRuntimeEnv({
    appId: "novel-h5",
    appName: "MiniX Novel H5",
    platform: "h5",
    allowLocationParams: true,
  });
}
