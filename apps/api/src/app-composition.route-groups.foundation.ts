import { createSettingsResponse } from "./data";
import { registerAuthRoutes } from "./domains/auth/routes";
import { registerContentRoutes } from "./domains/content/routes";
import { registerItemRoutes } from "./domains/items/routes";
import { registerPublicRoutes } from "./domains/public/routes";
import { registerSettingsRoutes } from "./domains/settings/routes";
import { applySettingsUpdate } from "./domains/settings/state";
import type { RegisterApiRouteGroupsOptions } from "./app-composition.route-groups.types";

export function registerFoundationRouteGroups(options: RegisterApiRouteGroupsOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    createApiAppOptions,
    authRateLimitStore,
  } = options;

  registerPublicRoutes({ app });

  registerAuthRoutes({
    app,
    requireSession,
    resolveStore,
    ...(createApiAppOptions.authRateLimitConfig
      ? { authRateLimitConfig: createApiAppOptions.authRateLimitConfig }
      : {}),
    authRateLimitStore,
  });

  registerItemRoutes({
    app,
    requireSession,
  });

  registerContentRoutes({
    app,
    requireSession,
    resolveStore,
  });

  registerSettingsRoutes({
    app,
    requireSession,
    resolveStore,
    createSettingsResponse,
    applySettingsUpdate,
  });
}
