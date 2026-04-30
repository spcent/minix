import type { Context } from "hono";
import type { ZodType } from "zod";

import {
  type RouteUserStateContext,
  withParsedRouteBody,
  withRouteUserStateMutation,
  withRouteUserStateMutationBody,
} from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiBindings, ApiStore, StoredUploadRecord, UserState } from "../../types";
import { createUploadResponse, findUploadRecordByAssetId } from "./pipeline";

export function loadUploadTaskRecordOrResponse(userState: UserState, taskId: string, traceId: string) {
  const existing = userState.uploadsByTaskId[taskId];
  if (!existing) {
    return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
  }

  return existing;
}

export function loadAttachUploadRecordOrResponse(
  userState: UserState,
  input: {
    taskId?: string;
    assetId?: string;
    traceId: string;
  },
) {
  const existing = input.taskId
    ? userState.uploadsByTaskId[input.taskId]
    : input.assetId
      ? findUploadRecordByAssetId(userState, input.assetId)
      : undefined;
  if (!existing) {
    return jsonError("NOT_FOUND", "Upload task not found.", 404, input.traceId);
  }

  return existing;
}

export async function scheduleUploadCleanupForRecord(input: {
  scheduleUploadCleanupJob: (job: {
    store: ApiStore;
    userId: string;
    userState: UserState;
    taskId: string;
    scheduledAt?: string;
  }) => Promise<void>;
  context: RouteUserStateContext;
  record: StoredUploadRecord;
}) {
  if (input.record.cleanupRecord?.retentionStatus !== "scheduled_cleanup") {
    return;
  }

  await input.scheduleUploadCleanupJob({
    store: input.context.store,
    userId: input.context.session.userId,
    userState: input.context.userState,
    taskId: input.record.uploadTask.taskId,
    ...(input.record.cleanupRecord.cleanupScheduledAt ? { scheduledAt: input.record.cleanupRecord.cleanupScheduledAt } : {}),
  });
}

export function withUploadRecordMutation<TPayload extends { taskId: string }>(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
  schema: ZodType<TPayload>,
  mutate: (input: {
    payload: TPayload;
    existing: StoredUploadRecord;
    context: RouteUserStateContext;
  }) => Promise<StoredUploadRecord> | StoredUploadRecord,
  options: {
    afterRecordSaved?: (input: {
      payload: TPayload;
      record: StoredUploadRecord;
      context: RouteUserStateContext;
    }) => Promise<void> | void;
  } = {},
) {
  return withParsedRouteBody(c, schema, (payload) =>
    withRouteUserStateMutation(c, resolveStore, async (context) => {
      const existing = loadUploadTaskRecordOrResponse(context.userState, payload.taskId, context.traceId);
      if (existing instanceof Response) {
        return existing;
      }

      const record = await mutate({ payload, existing, context });
      context.userState.uploadsByTaskId[payload.taskId] = record;
      await options.afterRecordSaved?.({ payload, record, context });
      return c.json(createUploadResponse(record));
    }),
  );
}

export function withUploadSessionMutation<TPayload>(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
  schema: ZodType<TPayload>,
  handler: (context: RouteUserStateContext & { payload: TPayload }) => Promise<Response> | Response,
) {
  return withRouteUserStateMutationBody(c, resolveStore, schema, handler);
}
