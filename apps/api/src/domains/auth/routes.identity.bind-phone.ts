import type { IdentityTransitionResponse } from "@minix/contracts";

import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import {
  createIdentityAuditRecord,
  createIdentityWorkflow,
  createMergePreview,
  createUserIdFromCredential,
  isMergeSampleIdentity,
} from "./identity";
import type { RegisterAuthRoutesOptions } from "./routes";
import { identityBindPhoneSchema } from "./schemas";
import { createAuthResponseFromSession, resolveRedirectTarget } from "./session";
import { consumePhoneVerification } from "./security";

export function registerAuthIdentityBindPhoneRoute(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore">,
) {
  const { app, resolveStore } = options;

  app.post("/auth/identity/bind-phone", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, identityBindPhoneSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    if (!(session.identity.wechatBound || session.platform === "wechat")) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "wechat_binding_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (session.identity.phoneBound) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "conflict",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "phone_already_bound",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const store = resolveStore(c.env);
    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "phone_binding",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "verification_code_invalid",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        credentialProtection: verified.protection,
        redirectTarget,
      }));
    }
    const mergeCandidate = isMergeSampleIdentity({ phoneNumber: payload.phoneNumber }) && targetUserId !== session.userId;
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
        kind: "phone_binding",
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
            message: "Phone binding merge preview created.",
          }),
          createIdentityAuditRecord({
            action: "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Phone binding requires explicit merge confirmation.",
          }),
        ],
      });
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      sourceState.boundPhoneNumber = payload.phoneNumber;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${session.userId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId: session.userId,
      targetLabel,
      sourceState,
      targetState: sourceState,
      requiresConfirmation: false,
      recoveryMessage:
        "Phone binding completed on the current account; no cross-account merge was required.",
    });
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = createIdentityWorkflow({
      kind: "phone_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel,
      mergePreview,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "Phone binding completed without cross-account merge.",
        }),
      ],
    });
    sourceState.boundPhoneNumber = payload.phoneNumber;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: true,
        wechatBound: true,
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const workflow = sourceState.lastIdentityWorkflow;
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
