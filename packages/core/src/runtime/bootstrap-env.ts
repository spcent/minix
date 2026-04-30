import type { RuntimeEnv } from "../types/index";

export interface BootstrapEnvGlobals {
  process?: {
    env?: Record<string, string | undefined>;
  };
  location?: {
    search?: string;
  };
  __MINIX_BOOTSTRAP_ENV__?: BootstrapRuntimeEnvOverride;
}

export interface BootstrapRuntimeEnvOverride {
  apiBaseUrl?: string;
  useMock?: boolean;
}

export interface CreateBootstrapRuntimeEnvOptions {
  appId: string;
  appName: string;
  platform: RuntimeEnv["platform"];
  defaultApiBaseUrl: string;
  mockApiBaseUrl: string;
  version: string;
  allowLocationParams?: boolean;
}

export interface CreateOfficialHostBootstrapRuntimeEnvOptions {
  appId: string;
  appName: string;
  platform: RuntimeEnv["platform"];
  defaultApiBaseUrl?: string;
  mockApiBaseUrl?: string;
  version?: string;
  allowLocationParams?: boolean;
}

export const DEFAULT_BOOTSTRAP_API_BASE_URL = "http://localhost:3000";
export const DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL = "https://mock.minix.local";
export const DEFAULT_BOOTSTRAP_VERSION = "1.0.0";

export function parseBootstrapBooleanFlag(value: string | boolean | null | undefined): boolean | undefined {
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

export function readBootstrapProcessEnv(name: string, globals: BootstrapEnvGlobals = globalThis): string | undefined {
  return globals.process?.env?.[name];
}

export function readBootstrapLocationParam(name: string, globals: BootstrapEnvGlobals = globalThis): string | undefined {
  const search = globals.location?.search;
  if (!search) {
    return undefined;
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(name) ?? undefined;
}

export function readBootstrapEnvOverride<TOverride extends BootstrapRuntimeEnvOverride>(
  globals: BootstrapEnvGlobals = globalThis,
): TOverride | undefined {
  return globals.__MINIX_BOOTSTRAP_ENV__ as TOverride | undefined;
}

export function createBootstrapRuntimeEnv(
  options: CreateBootstrapRuntimeEnvOptions,
  globals: BootstrapEnvGlobals = globalThis,
): RuntimeEnv {
  const override = readBootstrapEnvOverride(globals);
  const queryMockFlag = options.allowLocationParams
    ? parseBootstrapBooleanFlag(readBootstrapLocationParam("minix_use_mock", globals))
    : undefined;
  const queryApiBaseUrl = options.allowLocationParams
    ? readBootstrapLocationParam("minix_api_base_url", globals)
    : undefined;
  const useMock =
    override?.useMock ??
    parseBootstrapBooleanFlag(readBootstrapProcessEnv("MINIX_USE_MOCK", globals)) ??
    queryMockFlag ??
    false;
  const apiBaseUrl =
    override?.apiBaseUrl ??
    readBootstrapProcessEnv("MINIX_API_BASE_URL", globals) ??
    queryApiBaseUrl ??
    (useMock ? options.mockApiBaseUrl : options.defaultApiBaseUrl);

  return {
    appId: options.appId,
    appName: options.appName,
    platform: options.platform,
    apiBaseUrl,
    debug: useMock,
    version: options.version,
  };
}

export function createOfficialHostBootstrapRuntimeEnv(
  options: CreateOfficialHostBootstrapRuntimeEnvOptions,
  globals: BootstrapEnvGlobals = globalThis,
): RuntimeEnv {
  return createBootstrapRuntimeEnv(
    {
      appId: options.appId,
      appName: options.appName,
      platform: options.platform,
      defaultApiBaseUrl: options.defaultApiBaseUrl ?? DEFAULT_BOOTSTRAP_API_BASE_URL,
      mockApiBaseUrl: options.mockApiBaseUrl ?? DEFAULT_BOOTSTRAP_MOCK_API_BASE_URL,
      version: options.version ?? DEFAULT_BOOTSTRAP_VERSION,
      ...(options.allowLocationParams !== undefined ? { allowLocationParams: options.allowLocationParams } : {}),
    },
    globals,
  );
}
