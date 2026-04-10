import type { RuntimeEnv } from "@minix/core";

export interface HostH5BootstrapEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export const HOST_H5_DEFAULT_API_BASE_URL = "http://localhost:3000";
export const HOST_H5_MOCK_API_BASE_URL = "https://mock.minix.local";

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

function readLocationParam(name: string): string | undefined {
  const globals = globalThis as typeof globalThis & {
    location?: { search?: string };
  };
  const search = globals.location?.search;
  if (!search) {
    return undefined;
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(name) ?? undefined;
}

function readOverride(): HostH5BootstrapEnvOverride | undefined {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__?: HostH5BootstrapEnvOverride;
  };

  return globals.__MINIX_BOOTSTRAP_ENV__;
}

export function loadHostH5Env(): RuntimeEnv {
  const override = readOverride();
  const useMock =
    override?.useMock ??
    parseBooleanFlag(readProcessEnv("MINIX_USE_MOCK")) ??
    parseBooleanFlag(readLocationParam("minix_use_mock")) ??
    false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readProcessEnv("MINIX_API_BASE_URL") ??
    readLocationParam("minix_api_base_url") ??
    (useMock ? HOST_H5_MOCK_API_BASE_URL : HOST_H5_DEFAULT_API_BASE_URL);

  return {
    appId: "host-h5",
    appName: "MiniX Host H5",
    platform: "h5",
    apiBaseUrl,
    debug: useMock,
    version: "1.0.0",
  };
}
