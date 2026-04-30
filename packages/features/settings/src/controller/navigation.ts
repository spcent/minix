import { ok, type AppKernel } from "@minix/core";
import type { AppRouteId } from "@minix/contracts";

export function createSettingsNavigation(kernel: AppKernel) {
  return {
    routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
      if (!routeId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(routeId, params);
    },
  };
}
