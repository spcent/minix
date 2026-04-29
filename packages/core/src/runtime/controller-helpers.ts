import type { AuthRedirectTarget } from "@minix/contracts";

import { ok, type Result } from "../error/index";
import { createAuthRedirectParams } from "./auth-redirect";
import type { AppKernel } from "./app";

export type ControllerRouteParams = Record<string, string | number | boolean>;

export interface CreateControllerRouterHelpersOptions {
  kernel: AppKernel;
  loginRouteId?: string | undefined;
  authRedirectSource?: string | undefined;
}

export function createCurrentAuthRedirectTarget(
  kernel: AppKernel,
  options: {
    source?: string;
    reason?: AuthRedirectTarget["reason"];
  } = {},
): AuthRedirectTarget {
  const current = kernel.router.current();
  return {
    ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
    ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
    ...(options.source ? { source: options.source } : {}),
    reason: options.reason ?? "auth-required",
  };
}

export function createControllerRouterHelpers(options: CreateControllerRouterHelpersOptions) {
  const { kernel, loginRouteId, authRedirectSource } = options;

  return {
    async routeToOptional(routeId?: string, params?: ControllerRouteParams) {
      if (!routeId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(routeId, params);
    },

    async routeToLogin() {
      if (!loginRouteId) {
        return ok(undefined);
      }

      return kernel.router.replaceRoute(
        loginRouteId,
        createAuthRedirectParams(
          createCurrentAuthRedirectTarget(kernel, {
            ...(authRedirectSource ? { source: authRedirectSource } : {}),
            reason: "auth-required",
          }),
        ),
      );
    },
  };
}

export function createSingleFlightHydrator<TValue>(
  run: (force: boolean) => Promise<Result<TValue>>,
): (force?: boolean) => Promise<Result<TValue>> {
  let hydration: Promise<Result<TValue>> | null = null;

  return (force = false) => {
    if (!force && hydration) {
      return hydration;
    }

    hydration = run(force).finally(() => {
      hydration = null;
    });
    return hydration;
  };
}

export function isUnauthorizedResult(result: Result<unknown>): boolean {
  return !result.ok && result.error.code === "UNAUTHORIZED";
}
