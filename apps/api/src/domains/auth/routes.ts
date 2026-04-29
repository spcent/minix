import type { ApiRouteBaseOptions } from "../route-options";
import type { AuthOAuthProvider, AuthSmsDeliveryProvider } from "./provider";
import { registerAuthIdentityRoutes } from "./routes.identity";
import { registerAuthLoginRoutes } from "./routes.login";
import { registerAuthOAuthRoutes } from "./routes.oauth";
import { registerAuthPasswordRoutes } from "./routes.password";
import { registerAuthSessionRoutes } from "./routes.session";
import { registerAuthVerificationRoutes } from "./routes.verification";

export interface RegisterAuthRoutesOptions extends ApiRouteBaseOptions {
  authRateLimitConfig?: import("../../rate-limit").AuthRateLimitConfig | Partial<import("../../rate-limit").AuthRateLimitConfig>;
  authRateLimitStore?: import("../../rate-limit").RateLimitCounterStore;
  authSmsProvider?: AuthSmsDeliveryProvider;
  authOAuthProvider?: AuthOAuthProvider;
}

export function registerAuthRoutes(options: RegisterAuthRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    authRateLimitConfig,
    authRateLimitStore,
    authSmsProvider,
    authOAuthProvider,
  } = options;

  registerAuthVerificationRoutes({
    app,
    resolveStore,
    ...(authRateLimitConfig ? { authRateLimitConfig } : {}),
    ...(authRateLimitStore ? { authRateLimitStore } : {}),
    ...(authSmsProvider ? { authSmsProvider } : {}),
  });

  registerAuthPasswordRoutes({ app, resolveStore });

  registerAuthOAuthRoutes({ app, resolveStore, ...(authOAuthProvider ? { authOAuthProvider } : {}) });

  registerAuthLoginRoutes({
    app,
    resolveStore,
    ...(authRateLimitConfig ? { authRateLimitConfig } : {}),
    ...(authRateLimitStore ? { authRateLimitStore } : {}),
    ...(authOAuthProvider ? { authOAuthProvider } : {}),
  });

  registerAuthSessionRoutes({
    app,
    resolveStore,
    ...(authRateLimitConfig ? { authRateLimitConfig } : {}),
    ...(authRateLimitStore ? { authRateLimitStore } : {}),
  });

  registerAuthIdentityRoutes({
    app,
    requireSession,
    resolveStore,
    ...(authOAuthProvider ? { authOAuthProvider } : {}),
  });
}
