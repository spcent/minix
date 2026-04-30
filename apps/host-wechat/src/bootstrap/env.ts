import {
  DEFAULT_BOOTSTRAP_API_BASE_URL,
  DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL,
  createOfficialHostBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type HostWechatBootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const HOST_WECHAT_DEFAULT_API_BASE_URL = DEFAULT_BOOTSTRAP_API_BASE_URL;
export const HOST_WECHAT_MOCK_API_BASE_URL = DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL;

export function loadHostWechatEnv(): RuntimeEnv {
  return createOfficialHostBootstrapRuntimeEnv({
    appId: "host-wechat",
    appName: "MiniX Host WeChat",
    platform: "wechat",
  });
}
