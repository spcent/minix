import { createUnauthorizedResponse, resolveBearerSession } from "../../http/auth";
import { getRouteTraceId, loadRouteUserState, parseRouteBody } from "../../http/route-context";
import { jsonError } from "../../http/response";
import { ACCOUNT_OPERATION_COOLDOWN_MS, appendAccountOperationRecord, setAccountOperationCooldown, resolveAccountSecurityPhoneNumber } from "./operations";
import {
  applyAccountAvatarBinding,
  createAccountOperationResponse,
  createCurrentUserResponse,
} from "./current-user";
import { applyAccountProfileUpdate } from "./profile";
import type { AccountRouteHelpers } from "./route-helpers";
import type { RegisterAccountRoutesOptions } from "./route-options";
import { changeAccountPhoneSchema, updateAccountProfileSchema } from "./schemas";

export function registerAccountIdentityRoutes(
  options: RegisterAccountRoutesOptions,
  helpers: AccountRouteHelpers,
) {
  const { app, resolveStore, createUserIdFromCredential, consumePhoneVerification } = options;
  const {
    loadAccountActionContext,
    createBlockedAccountOperationResponse,
    createVerificationFailureResponse,
    appendAccountAuditEvent,
    verifyAccountSecurityCredential,
  } = helpers;

  app.get("/me", async (c) => {
    const traceId = getRouteTraceId(c);
    const store = resolveStore(c.env);
    const { session } = await resolveBearerSession(c.req.header("authorization"), store);
    if (!session) {
      return createUnauthorizedResponse(traceId);
    }

    const userState = await store.getUserState(session.userId);
    return c.json(createCurrentUserResponse(session, userState, c.req.url));
  });

  app.post("/account/profile", async (c) => {
    const payload = await parseRouteBody(c, updateAccountProfileSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "edit_profile");
    if (!operation?.available) {
      return jsonError(
        "FORBIDDEN",
        operation?.blockedReason ?? "Profile editing is unavailable.",
        409,
        traceId,
      );
    }

    applyAccountProfileUpdate(userState, payload);
    applyAccountAvatarBinding(session, userState, payload.avatarAssetId);
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(session, userState, c.req.url, "Profile updated."),
    );
  });

  app.post("/account/change-phone", async (c) => {
    const payload = await parseRouteBody(c, changeAccountPhoneSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const actionContext = await loadAccountActionContext(c, { guardSecurity: true });
    if (actionContext instanceof Response) {
      return actionContext;
    }
    const { traceId, session, store, userState, clientId, deviceId } = actionContext;
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "change_phone");
    if (!operation?.available) {
      const response = await createBlockedAccountOperationResponse({
        userState,
        kind: "change_phone",
        message: operation?.blockedReason ?? "Phone binding changes are unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        store,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      return c.json(response, 409);
    }

    if (operation.riskPrompt && !payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        "Phone change requires explicit risk confirmation.",
        400,
        traceId,
      );
    }

    const currentSecurityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (operation.verificationRequired) {
      const currentCredentialVerification = await verifyAccountSecurityCredential({
        c,
        store,
        session,
        userState,
        verificationCode: payload.securityVerificationCode,
        missingCredentialMessage:
          "Phone change requires an existing verified phone security credential.",
        missingCodeMessage:
          "Phone change requires the current phone security verification code.",
      });
      if (currentCredentialVerification instanceof Response) {
        return currentCredentialVerification;
      }
    }

    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "change_phone",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      return createVerificationFailureResponse({
        c,
        store,
        session,
        userState,
        verification: {
          ok: false,
          status: verified.status,
          message: verified.message,
          protection: verified.protection,
        },
      });
    }

    userState.boundPhoneNumber = payload.phoneNumber;
    setAccountOperationCooldown(userState, {
      kind: "change_phone",
      label:
        "Phone changes are temporarily locked while the new credential propagates.",
      durationMs: ACCOUNT_OPERATION_COOLDOWN_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "change_phone",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `Bound phone updated to ${payload.phoneNumber.replace(/[^\d]/g, "").slice(0, 3)}****${payload.phoneNumber.replace(/[^\d]/g, "").slice(-4)}.`,
      verificationPurpose: currentSecurityPhone ? "account_security" : "change_phone",
      notificationHookLabel: "notify:phone_changed",
    });
    appendAccountAuditEvent({
      userState,
      action: "change_phone",
      result: "allowed",
      message: "Bound phone updated after security verification.",
      session,
      traceId,
      clientId,
      ...(deviceId ? { deviceId } : {}),
    });
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        "Phone binding updated.",
        operationRecord,
      ),
    );
  });
}
