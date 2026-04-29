import type { AuthPhoneVerificationResponse, LoginPlatformKind } from "@minix/contracts";

import { resolveBearerSession } from "../../http/auth";
import { getRouteTraceId, loadRouteClientContext, parseRouteBody } from "../../http/route-context";
import { resolveClientId } from "../../rate-limit";
import { createUserIdFromCredential } from "./identity";
import { resolveSmsProviderMode } from "./route-provider";
import { createProviderUnavailableResponse } from "./route-responses";
import type { RegisterAuthRoutesOptions } from "./routes";
import { phoneVerificationRequestSchema } from "./schemas";
import {
  appendSecurityAuditEvent,
  createPhonePurposeKey,
  createPhoneVerificationChallenge,
  ensureAuthSecurityState,
  evaluateSecurityDecision,
  getRecentSecurityAuditEvents,
  guardSecurityRateLimit,
  maskPhoneNumber,
  PHONE_VERIFICATION_MAX_ATTEMPTS,
  PHONE_VERIFICATION_RETRY_AFTER_SECONDS,
  resolveRequestDeviceId,
} from "./security";

export function registerAuthVerificationRoutes(
  options: Pick<
    RegisterAuthRoutesOptions,
    "app" | "resolveStore" | "authRateLimitConfig" | "authRateLimitStore" | "authSmsProvider"
  >,
) {
  const { app, resolveStore, authRateLimitConfig, authRateLimitStore, authSmsProvider } = options;

  app.post("/auth/verification-code/request", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, phoneVerificationRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const store = resolveStore(c.env);
    const { clientId } = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    let userId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    let platform: LoginPlatformKind = "h5";
    if (payload.purpose === "account_security") {
      const { session } = await resolveBearerSession(c.req.header("authorization"), store);
      if (session) {
        userId = session.userId;
        platform = session.platform;
      }
    }
    const userState = await store.getUserState(userId);
    const guard = await guardSecurityRateLimit({
      c,
      store,
      userId,
      userState,
      action: "verification",
      scope: "verification",
      platform,
      clientId,
      deviceId: payload.deviceId,
      traceId,
      ...(authRateLimitConfig ? { config: authRateLimitConfig } : {}),
      ...(authRateLimitStore ? { counterStore: authRateLimitStore } : {}),
      blockedAction: "verification_rate_limited",
      blockedMessage: "Too many verification requests. Retry later.",
      ...(payload.riskContext?.frequencyKey ? { frequencyKey: payload.riskContext.frequencyKey } : {}),
      ...(payload.riskContext?.scene ? { scene: payload.riskContext.scene } : {}),
    });
    const now = Date.now();
    const nowIso = guard.nowIso;
    const rateLimitState = guard.rateLimitState;
    const securityDecision = evaluateSecurityDecision({
      userState,
      platform,
      riskContext: payload.riskContext,
      scope: "verification",
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    });
    const verificationAuditBase = {
      userState,
      scope: "verification" as const,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      clientId,
      platform,
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    };
    if (!guard.allowed) {
      return guard.response;
    }
    const challenge = await createPhoneVerificationChallenge({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: payload.purpose,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      now,
    });
    const maskedTarget = maskPhoneNumber(payload.phoneNumber);
    const smsProviderMode = resolveSmsProviderMode(c.env);
    let delivery: AuthPhoneVerificationResponse["delivery"];
    if (authSmsProvider) {
      const delivered = await authSmsProvider(
        {
          phoneNumber: payload.phoneNumber,
          maskedTarget,
          purpose: payload.purpose,
          verificationId: challenge.verificationId,
          verificationCode: challenge.code,
          ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
          ...(c.env?.MINIX_DEPLOY_ENV ? { deployEnv: c.env.MINIX_DEPLOY_ENV } : {}),
        },
        c.env,
      );
      if (!delivered.ok) {
        const securityState = ensureAuthSecurityState(userState);
        delete securityState.phoneVerificationsById[challenge.verificationId];
        delete securityState.latestVerificationIdByPhonePurpose[
          createPhonePurposeKey(payload.phoneNumber, payload.purpose)
        ];
        appendSecurityAuditEvent({
          ...verificationAuditBase,
          action: "verification_provider_unavailable",
          result: "blocked",
          message: delivered.error.message,
          createdAt: nowIso,
        });
        await store.saveUserState(userId, userState);
        return createProviderUnavailableResponse(c, delivered.error.message, delivered.error.retryAfterSeconds);
      }
      delivery = {
        provider: delivered.value.provider,
        providerMode: delivered.value.providerMode,
        providerLabel: delivered.value.providerLabel,
        providerReference: delivered.value.providerReference,
        maskedTarget: delivered.value.maskedTarget,
        message: delivered.value.message,
      };
    } else if (smsProviderMode === "production") {
      const securityState = ensureAuthSecurityState(userState);
      delete securityState.phoneVerificationsById[challenge.verificationId];
      delete securityState.latestVerificationIdByPhonePurpose[
        createPhonePurposeKey(payload.phoneNumber, payload.purpose)
      ];
      appendSecurityAuditEvent({
        ...verificationAuditBase,
        action: "verification_provider_unavailable",
        result: "blocked",
        message: "SMS provider is not configured for production mode.",
        createdAt: nowIso,
      });
      await store.saveUserState(userId, userState);
      return createProviderUnavailableResponse(c, "SMS provider is not configured for production mode.");
    } else {
      delivery = {
        provider: "simulated",
        providerMode: "sample",
        providerLabel: "Built-in simulated SMS",
        providerReference: `sms_${challenge.verificationId}`,
        maskedTarget,
        debugCode: challenge.code,
        message: "Verification code issued by the built-in simulated SMS provider.",
      };
    }
    appendSecurityAuditEvent({
      ...verificationAuditBase,
      action: "verification_code_issued",
      result: securityDecision.riskDecision.level === "review" ? "review" : "allowed",
      message: `Verification code issued for ${payload.purpose}.`,
      createdAt: nowIso,
    });
    await store.saveUserState(userId, userState);
    const response: AuthPhoneVerificationResponse = {
      verificationId: challenge.verificationId,
      phoneNumberMasked: maskedTarget,
      purpose: payload.purpose,
      expiresAt: challenge.expiresAt,
      retryAfterSeconds: PHONE_VERIFICATION_RETRY_AFTER_SECONDS,
      maxAttempts: PHONE_VERIFICATION_MAX_ATTEMPTS,
      delivery,
      riskDecision: securityDecision.riskDecision,
      ...(securityDecision.deviceIdentity ? { deviceIdentity: securityDecision.deviceIdentity } : {}),
      rateLimitState,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
    };

    return c.json(response);
  });
}
