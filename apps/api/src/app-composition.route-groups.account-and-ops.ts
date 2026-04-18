import type {
  RegisterAccountRoutesOptions,
} from "./domains/account/routes";
import type {
  RegisterOpsRoutesOptions,
} from "./domains/ops/routes";

import { registerAccountRoutes } from "./domains/account/routes";
import { registerOpsRoutes } from "./domains/ops/routes";
import type { RegisterApiRouteGroupsOptions } from "./app-composition.route-groups.types";

export function registerAccountAndOpsRouteGroups(options: RegisterApiRouteGroupsOptions) {
  const { app, requireSession, resolveStore, createApiAppOptions, security, jobs } = options;

  const guardAccountRateLimit: RegisterAccountRoutesOptions["guardSecurityRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "account",
      scope: "account",
      blockedAction: "account_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
  const runWiredOperationalJobs: RegisterOpsRoutesOptions["runOperationalJobs"] = (store, input) =>
    jobs.runOperationalJobs(store, input);

  registerOpsRoutes({
    app,
    requireSession,
    resolveStore,
    authSmsProviderConfigured: Boolean(createApiAppOptions.authSmsProvider),
    authOAuthProviderConfigured: Boolean(createApiAppOptions.authOAuthProvider),
    runOperationalJobs: runWiredOperationalJobs,
  });

  registerAccountRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardSecurityRateLimit: guardAccountRateLimit,
    appendSecurityAuditEvent: security.appendSecurityAuditEvent,
    createOperationBlockedResponse: security.createOperationBlockedResponse,
    consumePhoneVerification: security.consumePhoneVerification,
    createUserIdFromCredential: security.createUserIdFromCredential,
    createOAuthProviderLabel: security.createOAuthProviderLabel,
    createOAuthCredentialRecord: security.createOAuthCredentialRecord,
    ensureAuthSecurityState: security.ensureAuthSecurityState,
    loadOAuthCredentialLink: security.loadOAuthCredentialLink,
    scheduleOperationalJobForUser: jobs.scheduleOperationalJobForUser,
  });
}
