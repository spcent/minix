import {
  DEFAULT_BOOTSTRAP_API_BASE_URL,
  DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL,
  createOfficialHostBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type NovelWechatBootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const NOVEL_WECHAT_DEFAULT_API_BASE_URL = DEFAULT_BOOTSTRAP_API_BASE_URL;
export const NOVEL_WECHAT_MOCK_API_BASE_URL = DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL;

export function loadNovelWechatEnv(): RuntimeEnv {
  return createOfficialHostBootstrapRuntimeEnv({
    appId: "novel-wechat",
    appName: "MiniX Novel WeChat",
    platform: "wechat",
  });
}
