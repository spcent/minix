import type { AuthRedirectTarget as ContractAuthRedirectTarget } from "@minix/contracts";

import type { createInitialAuthPageState } from "../model";

export function formatProtectedPageNotice(label?: string | null): string | null {
  return label ? `Return to Home and sign in to open ${label}.` : null;
}

export function formatForceReauthNotice(label?: string | null): string {
  return label
    ? `Sign in again to continue to ${label}.`
    : "Sign in again to continue.";
}

export function createWorkflowRedirectTarget(state: ReturnType<typeof createInitialAuthPageState>): ContractAuthRedirectTarget | undefined {
  if (
    !state.redirectRouteId &&
    !state.redirectPath &&
    !state.redirectSource &&
    !state.redirectLabel &&
    !state.redirectReason &&
    !state.redirectForceReauth
  ) {
    return undefined;
  }

  return {
    ...(state.redirectRouteId ? { routeId: state.redirectRouteId } : {}),
    ...(state.redirectPath ? { path: state.redirectPath } : {}),
    ...(state.redirectParams ? { params: state.redirectParams } : {}),
    ...(state.redirectSource ? { source: state.redirectSource } : {}),
    ...(state.redirectLabel ? { label: state.redirectLabel } : {}),
    ...(state.redirectReason ? { reason: state.redirectReason } : {}),
    ...(state.redirectForceReauth ? { forceReauth: true } : {}),
  };
}
