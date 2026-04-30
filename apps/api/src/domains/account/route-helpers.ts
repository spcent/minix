import type {
  AccountOperation,
  AccountOperationRecord,
  AccountOperationResponse,
  AuthCredentialProtection,
} from "@minix/contracts";
import type { Context } from "hono";

import { getRouteTraceId, loadRouteClientContext, loadRouteUserState } from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiStore, SessionRecord, UserState } from "../../types";
import { createAccountOperationResponse } from "./current-user";
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

export type AccountSecurityOperationKind =
  | "change_phone"
  | "unbind_wechat"
  | "unlink_provider"
  | "revoke_provider"
  | "request_cancellation"
  | "revoke_cancellation";

export interface AccountRouteHelpers {
  loadAccountActionContext: (
    c: Context<any>,
    input?: { guardSecurity?: boolean },
  ) => Promise<AccountActionContext | Response>;
  createBlockedAccountOperationResponse: (input: {
    userState: UserState;
    kind: AccountSecurityOperationKind;
    message: string;
    session: SessionRecord;
    requestUrl: string;
    traceId: string;
    store: ApiStore;
    clientId: string;
    deviceId?: string;
  }) => Promise<AccountOperationResponse>;
  loadAvailableAccountOperation: (input: {
    c: Context<any>;
    operations: AccountOperation[];
    kind: AccountSecurityOperationKind;
    fallbackMessage: string;
    context: AccountActionContext;
  }) => Promise<AccountOperation | Response>;
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
  requireAccountRiskConfirmation: (input: {
    c: Context<any>;
    traceId: string;
    confirmed: boolean | undefined;
    message: string;
  }) => Response | undefined;
  commitAccountSecurityOperation: (input: {
    c: Context<any>;
    context: AccountActionContext;
    operationRecord: AccountOperationRecord;
    responseMessage: string;
    audit: {
      action: string;
      result: "allowed" | "blocked" | "review";
      message: string;
    };
    save?: () => Promise<void>;
  }) => Promise<Response>;
  runVerifiedAccountSecurityOperation: (input: {
    c: Context<any>;
    context: AccountActionContext;
    riskConfirmed: boolean | undefined;
    riskMessage: string;
    verificationCode: string | undefined;
    missingCredentialMessage: string;
    missingCodeMessage: string;
    mutate: () => AccountOperationRecord | Promise<AccountOperationRecord>;
    responseMessage: string;
    audit: {
      action: string;
      result: "allowed" | "blocked" | "review";
      message: string;
    };
    save?: () => Promise<void>;
  }) => Promise<Response>;
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
    const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    if (!input?.guardSecurity) {
      return {
        ...routeContext,
        ...clientContext,
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
      ...clientContext,
      actorUserId: routeContext.session.userId,
      traceId: routeContext.traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    return {
      ...routeContext,
      ...clientContext,
    };
  }

  async function createBlockedAccountOperationResponse(input: {
    userState: UserState;
    kind: AccountSecurityOperationKind;
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

  async function loadAvailableAccountOperation(input: {
    c: Context<any>;
    operations: AccountOperation[];
    kind: AccountSecurityOperationKind;
    fallbackMessage: string;
    context: AccountActionContext;
  }) {
    const operation = input.operations.find((item) => item.kind === input.kind);
    if (operation?.available) {
      return operation;
    }

    const response = await createBlockedAccountOperationResponse({
      userState: input.context.userState,
      kind: input.kind,
      message: operation?.blockedReason ?? input.fallbackMessage,
      session: input.context.session,
      requestUrl: input.c.req.url,
      traceId: input.context.traceId,
      store: input.context.store,
      clientId: input.context.clientId,
      ...(input.context.deviceId ? { deviceId: input.context.deviceId } : {}),
    });
    return input.c.json(response, 409);
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
      return jsonError("FORBIDDEN", input.missingCredentialMessage, 409, getRouteTraceId(input.c));
    }
    if (!input.verificationCode) {
      return jsonError("INVALID_ARGUMENT", input.missingCodeMessage, 400, getRouteTraceId(input.c));
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

  function requireAccountRiskConfirmation(input: {
    c: Context<any>;
    traceId: string;
    confirmed: boolean | undefined;
    message: string;
  }) {
    if (input.confirmed) {
      return undefined;
    }

    return jsonError("INVALID_ARGUMENT", input.message, 400, input.traceId);
  }

  async function commitAccountSecurityOperation(input: {
    c: Context<any>;
    context: AccountActionContext;
    operationRecord: AccountOperationRecord;
    responseMessage: string;
    audit: {
      action: string;
      result: "allowed" | "blocked" | "review";
      message: string;
    };
    save?: () => Promise<void>;
  }) {
    appendAccountAuditEvent({
      userState: input.context.userState,
      action: input.audit.action,
      result: input.audit.result,
      message: input.audit.message,
      session: input.context.session,
      traceId: input.context.traceId,
      clientId: input.context.clientId,
      ...(input.context.deviceId ? { deviceId: input.context.deviceId } : {}),
    });
    if (input.save) {
      await input.save();
    } else {
      await input.context.store.saveUserState(input.context.session.userId, input.context.userState);
    }

    return input.c.json(
      createAccountOperationResponse(
        input.context.session,
        input.context.userState,
        input.c.req.url,
        input.responseMessage,
        input.operationRecord,
      ),
    );
  }

  async function runVerifiedAccountSecurityOperation(input: {
    c: Context<any>;
    context: AccountActionContext;
    riskConfirmed: boolean | undefined;
    riskMessage: string;
    verificationCode: string | undefined;
    missingCredentialMessage: string;
    missingCodeMessage: string;
    mutate: () => AccountOperationRecord | Promise<AccountOperationRecord>;
    responseMessage: string;
    audit: {
      action: string;
      result: "allowed" | "blocked" | "review";
      message: string;
    };
    save?: () => Promise<void>;
  }) {
    const riskFailure = requireAccountRiskConfirmation({
      c: input.c,
      traceId: input.context.traceId,
      confirmed: input.riskConfirmed,
      message: input.riskMessage,
    });
    if (riskFailure) {
      return riskFailure;
    }

    const securityVerification = await verifyAccountSecurityCredential({
      c: input.c,
      store: input.context.store,
      session: input.context.session,
      userState: input.context.userState,
      verificationCode: input.verificationCode,
      missingCredentialMessage: input.missingCredentialMessage,
      missingCodeMessage: input.missingCodeMessage,
    });
    if (securityVerification instanceof Response) {
      return securityVerification;
    }

    const operationRecord = await input.mutate();
    return commitAccountSecurityOperation({
      c: input.c,
      context: input.context,
      operationRecord,
      responseMessage: input.responseMessage,
      audit: input.audit,
      ...(input.save ? { save: input.save } : {}),
    });
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
    loadAvailableAccountOperation,
    createVerificationFailureResponse,
    verifyAccountSecurityCredential,
    requireAccountRiskConfirmation,
    commitAccountSecurityOperation,
    runVerifiedAccountSecurityOperation,
    appendAccountAuditEvent,
  };
}
