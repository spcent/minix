import {
  createBootstrapRuntimeEnv,
  type BootstrapRuntimeEnvOverride,
  type RuntimeEnv,
} from "@minix/core";

export type HostH5BootstrapEnvOverride = BootstrapRuntimeEnvOverride;

export const HOST_H5_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const HOST_H5_MOCK_API_BASE_URL = "https://mock.minix.local";

export function loadHostH5Env(): RuntimeEnv {
  return createBootstrapRuntimeEnv({
    appId: "host-h5",
    appName: "MiniX Host H5",
    platform: "h5",
    defaultApiBaseUrl: HOST_H5_DEFAULT_API_BASE_URL,
    mockApiBaseUrl: HOST_H5_MOCK_API_BASE_URL,
    version: "1.0.0",
    allowLocationParams: true,
  });
}
