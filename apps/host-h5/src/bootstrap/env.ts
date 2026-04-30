import {
  DEFAULT_BOOTSTRAP_API_BASE_URL,
  DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL,
  createOfficialHostBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type HostH5BootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const HOST_H5_DEFAULT_API_BASE_URL = DEFAULT_BOOTSTRAP_API_BASE_URL;
export const HOST_H5_MOCK_API_BASE_URL = DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL;

export function loadHostH5Env(): RuntimeEnv {
  return createOfficialHostBootstrapRuntimeEnv({
    appId: "host-h5",
    appName: "MiniX Host H5",
    platform: "h5",
    allowLocationParams: true,
  });
}
