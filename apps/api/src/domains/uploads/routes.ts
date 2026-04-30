import type {
  UploadCancelRequest,
  UploadChunkRequest,
  UploadRetryRequest,
} from "@minix/contracts";

import {
  getRouteParam,
  loadRouteClientContext,
  loadRouteUserState,
  withRouteUserStateMutationBody,
} from "../../http/route-context";
import { escapeXml, jsonError } from "../../http/response";
import type { ApiStore, UserState } from "../../types";
import type {
  ApiClientContextRouteOptions,
  ApiClientStampedRateLimitGuardResult,
  ApiRateLimitGuardInput,
  ApiRouteBaseOptions,
} from "../route-options";
import { pickDefinedApiFields } from "../schema-helpers";
import {
  appendUploadChunkRecord,
  attachUploadRecord,
  cancelUploadPipeline,
  completeUploadRecord,
  createUploadResponse,
  createUploadSessionRecord,
  readUploadedAssetBinary,
  resolveUploadAssetForUser,
  retryUploadPipeline,
} from "./pipeline";
import {
  loadAttachUploadRecordOrResponse,
  scheduleUploadCleanupForRecord,
  withUploadRecordMutation,
  withUploadSessionMutation,
} from "./route-helpers";
import {
  normalizeUploadAttachRequest,
  normalizeUploadChunkRequest,
  normalizeUploadSessionRequest,
  uploadCancelSchema,
  uploadChunkRequestSchema,
  uploadCompleteSchema,
  uploadRetrySchema,
  uploadAttachSchema,
  uploadSessionRequestSchema,
} from "./schemas";

export interface RegisterUploadRoutesOptions extends ApiRouteBaseOptions, ApiClientContextRouteOptions {
  guardUploadSessionRateLimit: (input: ApiRateLimitGuardInput) => ApiClientStampedRateLimitGuardResult;
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
    return withUploadSessionMutation(c, resolveStore, uploadSessionRequestSchema, async (context) => {
      let record = createUploadSessionRecord(normalizeUploadSessionRequest(context.payload), c.req.url, context.userState, undefined, c.env);
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
      context.userState.uploadsByTaskId[record.uploadTask.taskId] = record;
      await scheduleUploadCleanupForRecord({ scheduleUploadCleanupJob, context, record });
      return c.json(createUploadResponse(record));
    });
  });

  app.post("/uploads/session", async (c) => {
    return withUploadSessionMutation(c, resolveStore, uploadSessionRequestSchema, async (context) => {
      const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
      const rateLimitGuard = await guardUploadSessionRateLimit({
        c,
        store: context.store,
        userId: context.session.userId,
        userState: context.userState,
        platform: context.session.platform,
        ...clientContext,
        traceId: context.traceId,
      });
      if (!rateLimitGuard.allowed) {
        return rateLimitGuard.response;
      }
      const record = createUploadSessionRecord(normalizeUploadSessionRequest(context.payload), c.req.url, context.userState, undefined, c.env);
      context.userState.uploadsByTaskId[record.uploadTask.taskId] = record;
      appendUploadSessionAudit({
        userState: context.userState,
        actorUserId: context.session.userId,
        ...clientContext,
        platform: context.session.platform,
        traceId: context.traceId,
      });
      return c.json(createUploadResponse(record));
    });
  });

  app.post("/uploads/chunk", async (c) => {
    return withUploadRecordMutation(c, resolveStore, uploadChunkRequestSchema, ({ payload, existing }) => {
      const request: UploadChunkRequest = normalizeUploadChunkRequest(payload);
      return appendUploadChunkRecord(existing, request, undefined, c.env);
    });
  });

  app.post("/uploads/complete", async (c) => {
    return withUploadRecordMutation(
      c,
      resolveStore,
      uploadCompleteSchema,
      ({ payload, existing }) =>
        completeUploadRecord(
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
        ),
      {
        afterRecordSaved: async ({ record, context }) => {
          if (record.cleanupRecord?.retentionStatus === "scheduled_cleanup") {
            await scheduleUploadCleanupForRecord({ scheduleUploadCleanupJob, context, record });
          }
        },
      },
    );
  });

  app.post("/uploads/attach", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, uploadAttachSchema, ({ payload, traceId, userState }) => {
      const existing = loadAttachUploadRecordOrResponse(userState, {
        ...pickDefinedApiFields(payload, ["taskId", "assetId"]),
        traceId,
      });
      if (existing instanceof Response) {
        return existing;
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
      return c.json(createUploadResponse(record));
    });
  });

  app.post("/uploads/retry", async (c) => {
    return withUploadRecordMutation(c, resolveStore, uploadRetrySchema, ({ payload, existing }) => {
      const request: UploadRetryRequest = { taskId: payload.taskId };
      return retryUploadPipeline(existing, request, undefined, c.env);
    });
  });

  app.post("/uploads/cancel", async (c) => {
    return withUploadRecordMutation(
      c,
      resolveStore,
      uploadCancelSchema,
      ({ payload, existing }) => {
        const request: UploadCancelRequest = {
          taskId: payload.taskId,
          ...pickDefinedApiFields(payload, ["reason"]),
        };
        return cancelUploadPipeline(existing, request, undefined, c.env);
      },
      {
        afterRecordSaved: async ({ record, context }) => {
          await scheduleUploadCleanupForRecord({ scheduleUploadCleanupJob, context, record });
        },
      },
    );
  });

  app.get("/uploads/assets/:assetId", async (c) => {
    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const assetId = getRouteParam(c, "assetId");
    const binary = readUploadedAssetBinary(userState, assetId);
    if (!binary) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, traceId);
    }
    return new Response(Buffer.from(binary.body), {
      headers: {
        "content-type": binary.contentType,
        "cache-control": "private, max-age=60",
      },
    });
  });

  app.get("/uploads/assets/:assetId/thumb", async (c) => {
    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const assetId = getRouteParam(c, "assetId");
    const asset = resolveUploadAssetForUser(userState, assetId);
    if (!asset) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, traceId);
    }
    const title = escapeXml(asset.fileName);
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
