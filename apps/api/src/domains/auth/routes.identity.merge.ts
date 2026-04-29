import type { IdentityTransitionResponse } from "@minix/contracts";

import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import {
  createIdentityAuditRecord,
  createIdentityWorkflow,
  createMergePreview,
  mergeUserStates,
} from "./identity";
import type { RegisterAuthRoutesOptions } from "./routes";
import { identityMergeSchema } from "./schemas";
import { createAuthResponseFromSession, resolveRedirectTarget } from "./session";

export function registerAuthIdentityMergeRoute(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore">,
) {
  const { app, resolveStore } = options;

  app.post("/auth/identity/merge", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, identityMergeSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const store = resolveStore(c.env);
    const sourceState = await store.getUserState(session.userId);
    const pendingWorkflow = sourceState.pendingIdentityWorkflow;

    if (!payload.confirm) {
      const workflowId = pendingWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? pendingWorkflow?.kind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget ?? pendingWorkflow?.continueTarget,
        targetUserId: payload.targetUserId,
        targetLabel: `account ${payload.targetUserId}`,
        failureReason: "merge_confirmation_required",
        ...(pendingWorkflow?.mergePreview ? { mergePreview: pendingWorkflow.mergePreview } : {}),
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge was cancelled before explicit confirmation.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the merge was not confirmed.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (!pendingWorkflow || pendingWorkflow.targetUserId !== payload.targetUserId) {
      const targetState = await store.getUserState(payload.targetUserId);
      const workflowId = pendingWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `account ${payload.targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: payload.targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: payload.targetUserId,
        targetLabel,
        failureReason: "merge_target_mismatch",
        mergePreview,
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge target did not match the pending identity workflow.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the pending workflow target did not match.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const targetState = await store.getUserState(payload.targetUserId);
    const workflowId = pendingWorkflow.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${payload.targetUserId}`;
    const mergePreview = pendingWorkflow.mergePreview ?? createMergePreview({
      sourceUserId: session.userId,
      targetUserId: payload.targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: pendingWorkflow.kind === "oauth_binding" ? "oauth_binding" : "account_merge",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      targetUserId: payload.targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(pendingWorkflow.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_confirmed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge was explicitly confirmed by the source session.",
        }),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge completed with rollback-safe target state persistence.",
        }),
      ],
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    await store.saveUserState(payload.targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: payload.targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        ...((Boolean(nextState.boundPhoneNumber) || session.identity.phoneBound !== undefined)
          ? { phoneBound: Boolean(nextState.boundPhoneNumber) || Boolean(session.identity.phoneBound) }
          : {}),
        wechatBound: Boolean(session.identity.wechatBound || session.platform === "wechat"),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        mergedUserId: session.userId,
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });
}
