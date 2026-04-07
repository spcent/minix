import type { AuthRedirectTarget } from "@minix/contracts";

import type { RouteLocation } from "../ports/router";

type RouteParams = Record<string, string | number | boolean>;

const AUTH_REDIRECT_QUERY_KEYS = {
  routeId: "redirectRouteId",
  path: "redirectPath",
  params: "redirectParams",
  source: "redirectSource",
  label: "redirectLabel",
  reason: "redirectReason",
  forceReauth: "forceReauth",
} as const;

function isRouteLocation(input: RouteLocation | RouteParams): input is RouteLocation {
  return typeof (input as RouteLocation).path === "string";
}

function asParams(input?: RouteLocation | RouteParams | null): RouteParams | undefined {
  if (!input) {
    return undefined;
  }

  if (isRouteLocation(input)) {
    return input.params;
  }

  return input;
}

function readStringParam(params: RouteParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function parseParams(value: string | number | boolean | undefined): RouteParams | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => {
        return typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean";
      }),
    );
  } catch {
    return undefined;
  }
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (token) => token.toUpperCase());
}

export function createAuthRedirectParams(target?: AuthRedirectTarget | null): RouteParams | undefined {
  if (!target) {
    return undefined;
  }

  const params: RouteParams = {};

  if (target.routeId) {
    params[AUTH_REDIRECT_QUERY_KEYS.routeId] = target.routeId;
  }
  if (target.path) {
    params[AUTH_REDIRECT_QUERY_KEYS.path] = target.path;
  }
  if (target.params && Object.keys(target.params).length > 0) {
    params[AUTH_REDIRECT_QUERY_KEYS.params] = JSON.stringify(target.params);
  }
  if (target.source) {
    params[AUTH_REDIRECT_QUERY_KEYS.source] = target.source;
  }
  if (target.label) {
    params[AUTH_REDIRECT_QUERY_KEYS.label] = target.label;
  }
  if (target.reason) {
    params[AUTH_REDIRECT_QUERY_KEYS.reason] = target.reason;
  }
  if (target.forceReauth) {
    params[AUTH_REDIRECT_QUERY_KEYS.forceReauth] = true;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

export function readAuthRedirectTarget(input?: RouteLocation | RouteParams | null): AuthRedirectTarget | null {
  const params = asParams(input);
  if (!params) {
    return null;
  }

  const routeId = readStringParam(params, AUTH_REDIRECT_QUERY_KEYS.routeId);
  const path = readStringParam(params, AUTH_REDIRECT_QUERY_KEYS.path);
  const source = readStringParam(params, AUTH_REDIRECT_QUERY_KEYS.source) ?? readStringParam(params, "from");
  const label = readStringParam(params, AUTH_REDIRECT_QUERY_KEYS.label);
  const reason = readStringParam(params, AUTH_REDIRECT_QUERY_KEYS.reason) ?? readStringParam(params, "reason");
  const redirectParams = parseParams(params[AUTH_REDIRECT_QUERY_KEYS.params]);
  const forceReauth = params[AUTH_REDIRECT_QUERY_KEYS.forceReauth] === true || params[AUTH_REDIRECT_QUERY_KEYS.forceReauth] === "true";

  if (!routeId && !path && !source && !label && !reason && !redirectParams && !forceReauth) {
    return null;
  }

  const target: AuthRedirectTarget = {};
  if (routeId) {
    target.routeId = routeId;
  }
  if (path) {
    target.path = path;
  }
  if (redirectParams) {
    target.params = redirectParams;
  }
  if (source) {
    target.source = source;
  }
  if (label) {
    target.label = label;
  }
  if (reason === "auth-required" || reason === "session-expired" || reason === "force-relogin") {
    target.reason = reason;
  }
  if (forceReauth) {
    target.forceReauth = true;
  }

  return target;
}

export function deriveAuthRedirectLabel(target?: AuthRedirectTarget | null): string | null {
  if (!target) {
    return null;
  }

  if (target.label) {
    return target.label;
  }

  if (target.source) {
    if (target.source === "plan") {
      return "Today's Plan";
    }

    if (target.source === "overview") {
      return "Overview";
    }

    if (target.source === "preferences") {
      return "Preferences";
    }

    return humanizeToken(target.source);
  }

  if (target.routeId) {
    const [, suffix = target.routeId] = target.routeId.split(".");
    return humanizeToken(suffix);
  }

  if (target.path) {
    const segments = target.path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? humanizeToken(lastSegment) : "Home";
  }

  return null;
}
