export interface BootstrapEnvGlobals {
  process?: {
    env?: Record<string, string | undefined>;
  };
  location?: {
    search?: string;
  };
}

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
