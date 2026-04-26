import type {
  AuthRateLimitState,
  UploadCancelRequest,
  UploadChunkRequest,
  UploadRetryRequest,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { loadRouteUserState, parseRouteBody } from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiBindings, ApiStore, UserState } from "../../types";
import {
  appendUploadChunkRecord,
  attachUploadRecord,
  cancelUploadPipeline,
  completeUploadRecord,
  createUploadResponse,
  createUploadSessionRecord,
  findUploadRecordByAssetId,
  readUploadedAssetBinary,
  resolveUploadAssetForUser,
  retryUploadPipeline,
} from "./pipeline";
import {
  normalizeUploadAttachRequest,
  normalizeUploadChunkRequest,
  normalizeUploadSessionRequest,
  uploadAttachSchema,
  uploadCancelSchema,
  uploadChunkRequestSchema,
  uploadCompleteSchema,
  uploadRetrySchema,
  uploadSessionRequestSchema,
} from "./schemas";

export interface RegisterUploadRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardUploadSessionRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    platform: string;
    clientId: string;
    deviceId?: string;
    traceId: string;
  }) => Promise<
    | {
        allowed: true;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
      }
    | {
        allowed: false;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
        response: Response;
      }
  >;
  appendUploadSessionAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
  }) => void;
  scheduleUploadCleanupJob: (input: {
    store: ApiStore;
    userId: string;
    userState: UserState;
    taskId: string;
    scheduledAt?: string;
  }) => Promise<void>;
}

export function registerUploadRoutes(options: RegisterUploadRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardUploadSessionRateLimit,
    appendUploadSessionAudit,
    scheduleUploadCleanupJob,
  } = options;

  app.use("/uploads", requireSession);
  app.use("/uploads/*", requireSession);

  app.post("/uploads", async (c) => {
    const payload = await parseRouteBody(c, uploadSessionRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { session, store, userState } = await loadRouteUserState(c, resolveStore);
    let record = createUploadSessionRecord(normalizeUploadSessionRequest(payload), c.req.url, userState, undefined, c.env);
    const initialTransfer = record.transfer;
    const initialSession = record.session;
    if (initialTransfer && !record.uploadError && initialSession) {
      for (const chunk of initialTransfer.chunks) {
        record = appendUploadChunkRecord(record, {
          taskId: record.uploadTask.taskId,
          sessionId: initialSession.sessionId,
          chunk,
        }, undefined, c.env);
        if (record.uploadError) {
          break;
        }
      }
      if (!record.uploadError) {
        record = completeUploadRecord(
          record,
          {
            taskId: record.uploadTask.taskId,
            sessionId: initialSession.sessionId,
            fileChecksum: initialTransfer.fileChecksum,
            checksumAlgorithm: initialTransfer.checksumAlgorithm,
          },
          c.req.url,
          undefined,
          c.env,
        );
      }
    }
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    if (record.cleanupRecord?.retentionStatus === "scheduled_cleanup") {
      await scheduleUploadCleanupJob({
        store,
        userId: session.userId,
        userState,
        taskId: record.uploadTask.taskId,
        ...(record.cleanupRecord.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/session", async (c) => {
    const payload = await parseRouteBody(c, uploadSessionRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardUploadSessionRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const record = createUploadSessionRecord(normalizeUploadSessionRequest(payload), c.req.url, userState, undefined, c.env);
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    appendUploadSessionAudit({
      userState,
      actorUserId: session.userId,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/chunk", async (c) => {
    const payload = await parseRouteBody(c, uploadChunkRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadChunkRequest = normalizeUploadChunkRequest(payload);
    const record = appendUploadChunkRecord(existing, request, undefined, c.env);
    userState.uploadsByTaskId[payload.taskId] = record;
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/complete", async (c) => {
    const payload = await parseRouteBody(c, uploadCompleteSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const record = completeUploadRecord(
      existing,
      {
        taskId: payload.taskId,
        sessionId: payload.sessionId,
        fileChecksum: payload.fileChecksum,
        checksumAlgorithm: payload.checksumAlgorithm,
      },
      c.req.url,
      undefined,
      c.env,
    );
    userState.uploadsByTaskId[payload.taskId] = record;
    if (record.cleanupRecord?.retentionStatus === "scheduled_cleanup") {
      await scheduleUploadCleanupJob({
        store,
        userId: session.userId,
        userState,
        taskId: record.uploadTask.taskId,
        ...(record.cleanupRecord.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/attach", async (c) => {
    const payload = await parseRouteBody(c, uploadAttachSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = payload.taskId
      ? userState.uploadsByTaskId[payload.taskId]
      : payload.assetId
        ? findUploadRecordByAssetId(userState, payload.assetId)
        : undefined;
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request = normalizeUploadAttachRequest(payload);
    const record = attachUploadRecord(existing, request);
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    if (request.reference.ownerType === "avatar" && record.uploadAsset?.assetId) {
      userState.profileOverrides = {
        ...(userState.profileOverrides ?? {}),
        avatarAssetId: record.uploadAsset.assetId,
      };
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/retry", async (c) => {
    const payload = await parseRouteBody(c, uploadRetrySchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadRetryRequest = { taskId: payload.taskId };
    const record = retryUploadPipeline(existing, request, undefined, c.env);
    userState.uploadsByTaskId[payload.taskId] = record;
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/cancel", async (c) => {
    const payload = await parseRouteBody(c, uploadCancelSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadCancelRequest = {
      taskId: payload.taskId,
      ...(payload.reason !== undefined ? { reason: payload.reason } : {}),
    };
    const record = cancelUploadPipeline(existing, request, undefined, c.env);
    userState.uploadsByTaskId[payload.taskId] = record;
    await scheduleUploadCleanupJob({
      store,
      userId: session.userId,
      userState,
      taskId: record.uploadTask.taskId,
      ...(record.cleanupRecord?.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.get("/uploads/assets/:assetId", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    const assetId = c.req.param("assetId");
    const binary = readUploadedAssetBinary(userState, assetId);
    if (!binary) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, c.get("traceId"));
    }
    return new Response(Buffer.from(binary.body), {
      headers: {
        "content-type": binary.contentType,
        "cache-control": "private, max-age=60",
      },
    });
  });

  app.get("/uploads/assets/:assetId/thumb", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    const assetId = c.req.param("assetId");
    const asset = resolveUploadAssetForUser(userState, assetId);
    if (!asset) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, c.get("traceId"));
    }
    const title = encodeURIComponent(asset.fileName);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#0f172a"/><text x="24" y="84" fill="#f8fafc" font-size="22" font-family="sans-serif">Preview</text><text x="24" y="116" fill="#cbd5e1" font-size="14" font-family="sans-serif">${title}</text></svg>`,
      {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=60",
        },
      },
    );
  });
}
