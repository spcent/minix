import { createAccountRouteHelpers } from "./route-helpers";
import type { RegisterAccountRoutesOptions } from "./route-options";
import { registerAccountIdentityRoutes } from "./routes.identity";
import { registerAccountRelationsRoutes } from "./routes.relations";
import { registerAccountSecurityRoutes } from "./routes.security";

export type { RegisterAccountRoutesOptions } from "./route-options";

export function registerAccountRoutes(options: RegisterAccountRoutesOptions) {
  const { app, requireSession } = options;

  app.use("/account", requireSession);
  app.use("/account/*", requireSession);
  const helpers = createAccountRouteHelpers(options);

  registerAccountIdentityRoutes(options, helpers);
  registerAccountSecurityRoutes(options, helpers);
  registerAccountRelationsRoutes(options);
}
