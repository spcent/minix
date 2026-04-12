import type {
  AccountOperationResponse,
  AuthCredentialProtection,
} from "@minix/contracts";
import type { Context } from "hono";

import { loadRouteUserState } from "../../http/route-context";
import type { ApiStore, SessionRecord, UserState } from "../../types";
import { resolveAccountSecurityPhoneNumber } from "./operations";
import type { RegisterAccountRoutesOptions } from "./route-options";

export interface AccountActionContext {
  traceId: string;
  session: SessionRecord;
  store: ApiStore;
  userState: UserState;
  clientId: string;
  deviceId?: string;
}

export interface AccountRouteHelpers {
  loadAccountActionContext: (
    c: Context<any>,
    input?: { guardSecurity?: boolean },
  ) => Promise<AccountActionContext | Response>;
  createBlockedAccountOperationResponse: (input: {
    userState: UserState;
    kind:
      | "change_phone"
      | "unbind_wechat"
      | "unlink_provider"
      | "revoke_provider"
      | "request_cancellation"
      | "revoke_cancellation";
    message: string;
    session: SessionRecord;
    requestUrl: string;
    traceId: string;
    store: ApiStore;
    clientId: string;
    deviceId?: string;
  }) => Promise<AccountOperationResponse>;
  createVerificationFailureResponse: (input: {
    c: Context<any>;
    store: ApiStore;
    session: SessionRecord;
    userState: UserState;
    verification: {
      ok: false;
      status: number;
      message: string;
      protection: AuthCredentialProtection | undefined;
    };
  }) => Promise<Response>;
  verifyAccountSecurityCredential: (input: {
    c: Context<any>;
    store: ApiStore;
    session: SessionRecord;
    userState: UserState;
    verificationCode: string | undefined;
    missingCredentialMessage: string;
    missingCodeMessage: string;
  }) => Promise<Response | { securityPhone: string }>;
  appendAccountAuditEvent: (input: {
    userState: UserState;
    action: string;
    result: "allowed" | "blocked" | "review";
    message: string;
    session: SessionRecord;
    traceId: string;
    clientId: string;
    deviceId?: string;
  }) => void;
}

export function createAccountRouteHelpers(
  options: RegisterAccountRoutesOptions,
): AccountRouteHelpers {
  const {
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardSecurityRateLimit,
    createOperationBlockedResponse,
    appendSecurityAuditEvent,
    consumePhoneVerification,
  } = options;

  async function loadAccountActionContext(
    c: Context<any>,
    input?: { guardSecurity?: boolean },
  ) {
    const routeContext = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    if (!input?.guardSecurity) {
      return {
        ...routeContext,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      };
    }

    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store: routeContext.store,
      userId: routeContext.session.userId,
      userState: routeContext.userState,
      action: "account",
      scope: "account",
      platform: routeContext.session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: routeContext.session.userId,
      traceId: routeContext.traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    return {
      ...routeContext,
      clientId,
      ...(deviceId ? { deviceId } : {}),
    };
  }

  async function createBlockedAccountOperationResponse(input: {
    userState: UserState;
    kind:
      | "change_phone"
      | "unbind_wechat"
      | "unlink_provider"
      | "revoke_provider"
      | "request_cancellation"
      | "revoke_cancellation";
    message: string;
    session: SessionRecord;
    requestUrl: string;
    traceId: string;
    store: ApiStore;
    clientId: string;
    deviceId?: string;
  }) {
    const response = createOperationBlockedResponse({
      userState: input.userState,
      kind: input.kind,
      actorLabel: "MiniX Account Center",
      message: input.message,
      session: input.session,
      requestUrl: input.requestUrl,
      traceId: input.traceId,
      clientId: input.clientId,
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    });
    await input.store.saveUserState(input.session.userId, input.userState);
    return response;
  }

  async function createVerificationFailureResponse(input: {
    c: Context<any>;
    store: ApiStore;
    session: SessionRecord;
    userState: UserState;
    verification: {
      ok: false;
      status: number;
      message: string;
      protection: AuthCredentialProtection | undefined;
    };
  }) {
    await input.store.saveUserState(input.session.userId, input.userState);
    input.c.status(input.verification.status as 400 | 423);
    return input.c.json({
      code: "INVALID_ARGUMENT",
      message: input.verification.message,
      credentialProtection: input.verification.protection,
    });
  }

  async function verifyAccountSecurityCredential(input: {
    c: Context<any>;
    store: ApiStore;
    session: SessionRecord;
    userState: UserState;
    verificationCode: string | undefined;
    missingCredentialMessage: string;
    missingCodeMessage: string;
  }) {
    const securityPhone = resolveAccountSecurityPhoneNumber(input.session, input.userState);
    if (!securityPhone) {
      return Response.json(
        {
          code: "FORBIDDEN",
          message: input.missingCredentialMessage,
        },
        { status: 409 },
      );
    }
    if (!input.verificationCode) {
      return Response.json(
        {
          code: "INVALID_ARGUMENT",
          message: input.missingCodeMessage,
        },
        { status: 400 },
      );
    }

    const verified = await consumePhoneVerification({
      userState: input.userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: input.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      return createVerificationFailureResponse({
        c: input.c,
        store: input.store,
        session: input.session,
        userState: input.userState,
        verification: {
          ok: false,
          status: verified.status,
          message: verified.message,
          protection: verified.protection,
        },
      });
    }

    return { securityPhone };
  }

  function appendAccountAuditEvent(input: {
    userState: UserState;
    action: string;
    result: "allowed" | "blocked" | "review";
    message: string;
    session: SessionRecord;
    traceId: string;
    clientId: string;
    deviceId?: string;
  }) {
    appendSecurityAuditEvent({
      userState: input.userState,
      scope: "account",
      action: input.action,
      result: input.result,
      message: input.message,
      createdAt: new Date().toISOString(),
      actorUserId: input.session.userId,
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      clientId: input.clientId,
      platform: input.session.platform,
      traceId: input.traceId,
    });
  }

  return {
    loadAccountActionContext,
    createBlockedAccountOperationResponse,
    createVerificationFailureResponse,
    verifyAccountSecurityCredential,
    appendAccountAuditEvent,
  };
}
