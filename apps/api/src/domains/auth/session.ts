import type {
  AuthAbnormalLoginPrompt,
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthOAuthCallbackResponse,
  AuthPhoneVerificationResponse,
  AuthRedirectTarget,
  AuthRiskDecision,
  AuthSecurityAuditEvent,
  AuthIdentityWorkflow,
  LoginMethod,
  LoginResponse,
  RefreshTokenResponse,
} from "@minix/contracts";

import { resolveProfileMedia } from "../../sample-assets";
import type { SessionRecord } from "../../types";

export function resolveLoginMethod(payload: {
  platform: "wechat" | "h5";
  credential: { method?: LoginMethod | undefined };
}): LoginMethod {
  if (payload.credential.method) {
    return payload.credential.method;
  }

  return payload.platform === "wechat" ? "wechat_code" : "guest";
}

export function resolveRedirectTarget(
  target?: {
    routeId?: string | undefined;
    path?: string | undefined;
    params?: Record<string, string | number | boolean> | undefined;
    source?: string | undefined;
    label?: string | undefined;
    reason?: "auth-required" | "session-expired" | "force-relogin" | undefined;
    forceReauth?: boolean | undefined;
  } | undefined,
): AuthRedirectTarget | undefined {
  if (!target) {
    return undefined;
  }

  const nextTarget: AuthRedirectTarget = {};
  if (target.routeId) {
    nextTarget.routeId = target.routeId;
  }
  if (target.path) {
    nextTarget.path = target.path;
  }
  if (target.params) {
    nextTarget.params = target.params;
  }
  if (target.source) {
    nextTarget.source = target.source;
  }
  if (target.label) {
    nextTarget.label = target.label;
  }
  if (target.reason) {
    nextTarget.reason = target.reason;
  }
  if (target.forceReauth) {
    nextTarget.forceReauth = true;
  }

  return Object.keys(nextTarget).length > 0 ? nextTarget : undefined;
}

export function resolveAbnormalLoginPrompt(input: {
  credential: { deviceId?: string | undefined };
  riskContext?: {
    deviceId?: string | undefined;
    frequencyKey?: string | undefined;
    ipRegion?: string | undefined;
    scene?: string | undefined;
  } | undefined;
}, method: LoginMethod): AuthAbnormalLoginPrompt | undefined {
  const deviceId = input.credential.deviceId ?? input.riskContext?.deviceId;
  const suspicious =
    input.riskContext?.scene === "suspicious-login" ||
    input.riskContext?.frequencyKey === "abnormal-login" ||
    input.riskContext?.ipRegion === "unusual-region" ||
    deviceId === "device-risk-review";

  if (!suspicious) {
    return undefined;
  }

  return {
    title: "Unusual sign-in detected",
    message:
      method === "guest"
        ? "This guest sign-in came from an unusual device context. Review the session before upgrading or binding the account."
        : "This sign-in came from an unusual device or region. Review the session details before continuing.",
    severity: "warning",
    acknowledgeRequired: true,
  };
}

export function resolveRiskDecision(input: {
  credentialDeviceId?: string | undefined;
  riskContext?: {
    deviceId?: string | undefined;
    frequencyKey?: string | undefined;
    ipRegion?: string | undefined;
    scene?: string | undefined;
  } | undefined;
}): AuthRiskDecision {
  const deviceId = input.credentialDeviceId ?? input.riskContext?.deviceId;
  const suspicious =
    input.riskContext?.scene === "suspicious-login" ||
    input.riskContext?.frequencyKey === "abnormal-login" ||
    input.riskContext?.ipRegion === "unusual-region" ||
    deviceId === "device-risk-review";

  return {
    ...(deviceId ? { deviceId } : {}),
    ...(input.riskContext?.frequencyKey ? { frequencyKey: input.riskContext.frequencyKey } : {}),
    ...(input.riskContext?.scene ? { scene: input.riskContext.scene } : {}),
    level: suspicious ? "review" : "allow",
    ...(suspicious ? { reason: "unusual_device_or_region" } : {}),
  };
}

export function createAuthResponseFromSession(
  session: SessionRecord,
  requestUrl: string,
  options: {
    abnormalLoginPrompt?: AuthAbnormalLoginPrompt | undefined;
    credentialProtection?: AuthCredentialProtection | undefined;
    deviceIdentity?: AuthDeviceIdentity | undefined;
    identityWorkflow?: AuthIdentityWorkflow | undefined;
    rateLimitState?: import("@minix/contracts").AuthRateLimitState | undefined;
    redirectTarget?: AuthRedirectTarget | undefined;
    riskDecision?: AuthRiskDecision | undefined;
    securityAuditEvents?: AuthSecurityAuditEvent[] | undefined;
  } = {},
): LoginResponse {
  return {
    userId: session.userId,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    profile: resolveProfileMedia(session.profile, requestUrl),
    session: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      issuedAt: Date.now(),
      tokenType: "Bearer",
    },
    identity: session.identity,
    authStatus: session.authStatus,
    ...(session.loginMethod ? { loginMethod: session.loginMethod } : {}),
    ...(options.abnormalLoginPrompt ? { abnormalLoginPrompt: options.abnormalLoginPrompt } : {}),
    ...(options.credentialProtection ? { credentialProtection: options.credentialProtection } : {}),
    ...(options.deviceIdentity ? { deviceIdentity: options.deviceIdentity } : {}),
    ...(options.identityWorkflow ? { identityWorkflow: options.identityWorkflow } : {}),
    ...(options.rateLimitState ? { rateLimitState: options.rateLimitState } : {}),
    ...(options.redirectTarget ? { redirectTarget: options.redirectTarget } : {}),
    ...(options.riskDecision ? { riskDecision: options.riskDecision } : {}),
    ...(options.securityAuditEvents ? { securityAuditEvents: options.securityAuditEvents } : {}),
  };
}

export type AuthRefreshResponse = RefreshTokenResponse;
export type AuthCallbackResponse = AuthOAuthCallbackResponse;
export type AuthVerificationResponse = AuthPhoneVerificationResponse;
