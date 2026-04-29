import type { RegisterAuthRoutesOptions } from "./routes";
import { registerAuthIdentityBindOAuthRoute } from "./routes.identity.bind-oauth";
import { registerAuthIdentityBindPhoneRoute } from "./routes.identity.bind-phone";
import { registerAuthIdentityMergeRoute } from "./routes.identity.merge";
import { registerAuthIdentityUpgradeRoute } from "./routes.identity.upgrade";

export function registerAuthIdentityRoutes(
  options: Pick<RegisterAuthRoutesOptions, "app" | "requireSession" | "resolveStore" | "authOAuthProvider">,
) {
  const { app, requireSession, resolveStore, authOAuthProvider } = options;

  app.use("/auth/identity/*", requireSession);

  registerAuthIdentityUpgradeRoute({ app, resolveStore });
  registerAuthIdentityBindPhoneRoute({ app, resolveStore });
  registerAuthIdentityBindOAuthRoute({
    app,
    resolveStore,
    ...(authOAuthProvider ? { authOAuthProvider } : {}),
  });
  registerAuthIdentityMergeRoute({ app, resolveStore });
}
