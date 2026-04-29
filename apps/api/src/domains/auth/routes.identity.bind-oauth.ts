import type { IdentityTransitionResponse } from "@minix/contracts";

import { jsonError } from "../../http/response";
import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import {
  createIdentityAuditRecord,
  createIdentityWorkflow,
  createMergePreview,
  mergeUserStates,
} from "./identity";
import { validateOAuthProviderCallback } from "./route-provider";
import type { RegisterAuthRoutesOptions } from "./routes";
import { identityBindOAuthSchema } from "./schemas";
import { createAuthResponseFromSession, resolveRedirectTarget } from "./session";
import {
  appendSecurityAuditEvent,
  createOAuthCredentialRecord,
  ensureAuthSecurityState,
  hashSecret,
  loadOAuthCredentialLink,
  sanitizeUserKey,
} from "./security";

export function registerAuthIdentityBindOAuthRoute(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore" | "authOAuthProvider">,
) {
  const { app, resolveStore, authOAuthProvider } = options;

  app.post("/auth/identity/bind-oauth", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, identityBindOAuthSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const store = resolveStore(c.env);
    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    if (!stateRecord || stateRecord.provider !== payload.provider || stateRecord.expiresAt <= Date.now()) {
      c.status(400);
      return c.json({
        code: "LOGIN_FAILED",
        message: "oauth state is invalid or expired",
        credentialProtection: { failureReason: "oauth_state_invalid" },
      });
    }

    if (stateRecord.purpose === "bind" && stateRecord.ownerUserId && stateRecord.ownerUserId !== session.userId) {
      return jsonError("FORBIDDEN", "oauth authorization state belongs to another account session", 403, traceId);
    }
    const validatedOAuth = await validateOAuthProviderCallback(
      {
        c,
        provider: payload.provider,
        purpose: "bind",
        state: payload.state,
        providerToken: payload.providerToken,
        providerUserId: payload.providerUserId,
        platform: session.platform,
      },
      authOAuthProvider,
    );
    if (!validatedOAuth.ok) {
      return validatedOAuth.response;
    }
    const providerLabel = validatedOAuth.value.providerLabel;
    const providerUserId = validatedOAuth.value.providerUserId;
    const linked = await loadOAuthCredentialLink(store, payload.provider, providerUserId);
    const sourceState = await store.getUserState(session.userId);
    const tokenHash = await hashSecret(payload.providerToken, payload.state);
    if (linked.record && linked.record.userId !== session.userId && linked.record.authorizationStatus !== "unlinked") {
      const targetState = await store.getUserState(linked.record.userId);
      const workflowId = `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `${providerLabel} account ${linked.record.userId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: linked.record.userId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "oauth_binding",
        status: payload.mergeStrategy === "merge" ? "completed" : "merge_required",
        workflowId,
        stage: payload.mergeStrategy === "merge" ? "completed" : "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: linked.record.userId,
        targetLabel,
        ...(payload.mergeStrategy === "merge" ? {} : { failureReason: "merge_confirmation_required" }),
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message: "OAuth provider binding merge preview created.",
          }),
          createIdentityAuditRecord({
            action: payload.mergeStrategy === "merge" ? "merge_completed" : "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message:
              payload.mergeStrategy === "merge"
                ? "OAuth provider binding completed through account merge."
                : "OAuth provider binding requires explicit merge confirmation.",
          }),
        ],
      });

      if (payload.mergeStrategy !== "merge") {
        sourceState.pendingIdentityWorkflow = workflow;
        sourceState.lastIdentityWorkflow = workflow;
        appendSecurityAuditEvent({
          userState: sourceState,
          scope: "auth",
          action: "oauth_bind_merge_required",
          result: "review",
          message: `${providerLabel} is already linked to another account and needs merge confirmation.`,
          createdAt: new Date().toISOString(),
          actorUserId: session.userId,
          platform: session.platform,
          traceId,
        });
        await store.saveUserState(session.userId, sourceState);
        return c.json(
          createAuthResponseFromSession(session, c.req.url, {
            identityWorkflow: workflow,
            redirectTarget,
          }),
        );
      }

      const nextState = mergeUserStates(targetState, {
        ...sourceState,
        lastIdentityWorkflow: workflow,
      });
      const record = createOAuthCredentialRecord({
        provider: payload.provider,
        providerUserId,
        userId: linked.record.userId,
        tokenHash,
        now: Date.now(),
        ...(linked.record ? { existing: linked.record } : {}),
      });
      ensureAuthSecurityState(nextState).oauthCredentialsByProviderSubject[linked.subject] = record;
      ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
      delete nextState.pendingIdentityWorkflow;
      nextState.lastIdentityWorkflow = workflow;
      appendSecurityAuditEvent({
        userState: nextState,
        scope: "auth",
        action: "oauth_bind_merge_completed",
        result: "allowed",
        message: `${providerLabel} binding completed through account merge.`,
        createdAt: new Date().toISOString(),
        actorUserId: linked.record.userId,
        platform: session.platform,
        traceId,
      });
      await store.saveUserState(linked.record.userId, nextState);
      await store.saveUserState(linked.indexUserId, linked.indexState);
      delete sourceState.pendingIdentityWorkflow;
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
      await store.saveUserState(stateUserId, stateStore);
      await store.revokeSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      const nextSession = await store.createSession({
        platform: session.platform,
        userId: linked.record.userId,
        profile: session.profile,
        authStatus: "authenticated",
        identity: {
          userId: linked.record.userId,
          ...(session.identity.phoneBound ? { phoneBound: true } : {}),
          ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        },
        loginMethod: "oauth",
      });
      const response: IdentityTransitionResponse = {
        ...createAuthResponseFromSession(nextSession, c.req.url, {
          identityWorkflow: workflow,
          redirectTarget,
        }),
        identityWorkflow: workflow,
      };
      return c.json(response);
    }

    const workflowId = `identity_workflow_${crypto.randomUUID()}`;
    const workflow = createIdentityWorkflow({
      kind: "oauth_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel: `${providerLabel} linked`,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "OAuth provider linked to the current account.",
        }),
      ],
    });
    const record = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId,
      userId: session.userId,
      tokenHash,
      now: Date.now(),
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(sourceState).oauthCredentialsByProviderSubject[linked.subject] = record;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    sourceState.lastIdentityWorkflow = workflow;
    appendSecurityAuditEvent({
      userState: sourceState,
      scope: "auth",
      action: "oauth_bind",
      result: "allowed",
      message: `${providerLabel} linked to the current account.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, sourceState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    await store.saveUserState(stateUserId, stateStore);
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        userId: session.userId,
        ...(session.identity.phoneBound ? { phoneBound: true } : {}),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: "oauth",
    });
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
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
