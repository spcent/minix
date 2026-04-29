import type { IdentityTransitionResponse } from "@minix/contracts";

import { jsonError } from "../../http/response";
import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import {
  createIdentityAuditRecord,
  createIdentityWorkflow,
  createMergePreview,
  createUserIdFromUpgradeRequest,
  isMergeSampleIdentity,
  mergeUserStates,
} from "./identity";
import { respondCredentialError } from "./route-responses";
import type { RegisterAuthRoutesOptions } from "./routes";
import { identityUpgradeSchema } from "./schemas";
import { createAuthResponseFromSession, resolveRedirectTarget } from "./session";
import {
  consumePhoneVerification,
  createCredentialSubject,
  verifyPasswordCredential,
} from "./security";

export function registerAuthIdentityUpgradeRoute(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore">,
) {
  const { app, resolveStore } = options;

  app.post("/auth/identity/upgrade", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, identityUpgradeSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    if (session.authStatus !== "guest" && !session.identity.anonymous) {
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: resolveRedirectTarget(payload.redirectTarget),
        failureReason: "guest_session_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow }));
    }

    if (payload.credential.method === "phone_code") {
      if (!payload.credential.phoneNumber || !payload.credential.verificationCode) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with phone verification requires phone number and verification code", 400, traceId);
      }
    }

    if (payload.credential.method === "password") {
      if (!(payload.credential.account || payload.credential.phoneNumber) || !payload.credential.password) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
    }

    const store = resolveStore(c.env);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const targetUserId = createUserIdFromUpgradeRequest(payload);
    const targetState = await store.getUserState(targetUserId);
    if (payload.credential.method === "phone_code") {
      const verified = await consumePhoneVerification({
        userState: targetState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "guest_upgrade",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        const workflow = createIdentityWorkflow({
          kind: "guest_upgrade",
          status: "blocked",
          sourceUserId: session.userId,
          continueTarget: redirectTarget,
          failureReason: "verification_code_invalid",
        });
        return c.json(
          createAuthResponseFromSession(session, c.req.url, {
            identityWorkflow: workflow,
            credentialProtection: verified.protection,
            redirectTarget,
          }),
        );
      }
    }

    if (payload.credential.method === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
      const verified = await verifyPasswordCredential({
        userState: targetState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        return respondCredentialError(c, "LOGIN_FAILED", verified.message, verified.status, verified.protection);
      }
    }
    const mergeCandidate = isMergeSampleIdentity(payload.credential);
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const sourceState = await store.getUserState(session.userId);
      const workflowId = `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `account ${targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "merge_required",
        workflowId,
        stage: "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel,
        failureReason: "merge_confirmation_required",
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Guest upgrade merge preview created.",
          }),
          createIdentityAuditRecord({
            action: "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Guest upgrade requires explicit merge confirmation.",
          }),
        ],
      });
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      if (payload.credential.phoneNumber) {
        sourceState.boundPhoneNumber = payload.credential.phoneNumber;
      }
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${targetUserId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: "guest_upgrade",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(sourceState.pendingIdentityWorkflow?.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Guest upgrade completed with rollback-safe state merge.",
        }),
      ],
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
      ...(payload.credential.phoneNumber ? { boundPhoneNumber: payload.credential.phoneNumber } : {}),
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    if (payload.credential.phoneNumber) {
      nextState.boundPhoneNumber = payload.credential.phoneNumber;
    }
    await store.saveUserState(targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: Boolean(payload.credential.phoneNumber),
        wechatBound: session.platform === "wechat" || Boolean(session.identity.wechatBound),
      },
      loginMethod: payload.credential.method,
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });


}
