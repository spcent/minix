import type {
  CreateMessageThreadResponse,
  ListMessageThreadsRequest,
  MarkThreadReadRequest,
  RetryMessageRequest,
  RetryMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
  SyncMessageThreadRequest,
} from "@minix/contracts";

import {
  loadRouteClientContext,
  withRouteUserState,
  withRouteUserStateMutationBody,
  withRouteUserStateQuery,
} from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiStore, UserState } from "../../types";
import type {
  ApiClientContextRouteOptions,
  ApiClientStampedRateLimitGuardResult,
  ApiRateLimitGuardInput,
  ApiRouteBaseOptions,
} from "../route-options";
import { pickDefinedApiFields } from "../schema-helpers";
import { getUnreadBadge, listNotifications, markNotificationsRead } from "./notifications";
import { withMessageRouteUnreadBadge } from "./route-responses";
import {
  createMessageThread,
  getMessageThread,
  listMessageThreadResponse,
  markThreadRead,
  retryThreadMessage,
  sendThreadMessage,
  syncMessageThread,
} from "./threads";
import {
  createMessageThreadSchema,
  markNotificationsReadSchema,
  markThreadReadSchema,
  messageThreadListQuerySchema,
  notificationsQuerySchema,
  normalizeCreateMessageThreadRequest,
  retryMessageSchema,
  sendMessageSchema,
  threadIdQuerySchema,
} from "./schemas";

export interface RegisterMessageRoutesOptions extends ApiRouteBaseOptions, ApiClientContextRouteOptions {
  guardMessageRateLimit: (
    input: ApiRateLimitGuardInput & {
      action: "thread_create" | "thread_send";
    },
  ) => ApiClientStampedRateLimitGuardResult;
  appendMessageAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
    action: "thread_create" | "thread_send";
  }) => void;
  scheduleMessageRetryJob: (input: {
    store: ApiStore;
    userId: string;
    userState: UserState;
    messageId: string;
  }) => Promise<void>;
}

export function registerMessageRoutes(options: RegisterMessageRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardMessageRateLimit,
    appendMessageAudit,
    scheduleMessageRetryJob,
  } = options;

  app.use("/notifications", requireSession);
  app.use("/notifications/*", requireSession);
  app.use("/messages", requireSession);
  app.use("/messages/*", requireSession);

  app.get("/notifications", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, notificationsQuerySchema, ({ query, userState }) =>
      c.json(listNotifications(userState, query, c.env)),
    );
  });

  app.post("/notifications/mark-read", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, markNotificationsReadSchema, ({ payload, userState }) => {
    const response = markNotificationsRead(userState, payload, c.env);
    return c.json(response);
    });
  });

  app.get("/messages/unread-badge", async (c) => {
    return withRouteUserState(c, resolveStore, ({ userState }) =>
      c.json(getUnreadBadge(userState, c.env)),
    );
  });

  app.get("/messages/threads", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, messageThreadListQuerySchema, ({ query, userState }) => {
    const request: ListMessageThreadsRequest = {
      ...pickDefinedApiFields(query, [
        "page",
        "pageSize",
        "type",
        "onlyUnread",
        "sort",
        "sourceTicketId",
      ] as const),
    };
    return c.json(
      withMessageRouteUnreadBadge(userState, listMessageThreadResponse(userState, request, c.env), c.env),
    );
    });
  });

  app.get("/messages/thread", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, threadIdQuerySchema, ({ query, traceId, userState }) => {
    const response = getMessageThread(userState, {
      threadId: query.threadId,
      ...pickDefinedApiFields(query, ["cursor"] as const),
    }, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env));
    });
  });

  app.post("/messages/thread/create", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, createMessageThreadSchema, async ({ payload, traceId, session, store, userState }) => {
    const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    const rateLimitGuard = await guardMessageRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "thread_create",
      platform: session.platform,
      ...clientContext,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const request = normalizeCreateMessageThreadRequest(payload);
    const response = createMessageThread(userState, request, new Date().toISOString(), c.env);
    appendMessageAudit({
      userState,
      actorUserId: session.userId,
      ...clientContext,
      platform: session.platform,
      traceId,
      action: "thread_create",
    });
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies CreateMessageThreadResponse);
    });
  });

  app.post("/messages/thread/read", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, markThreadReadSchema, ({ payload, traceId, userState }) => {
    const request: MarkThreadReadRequest = { threadId: payload.threadId };
    const response = markThreadRead(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env));
    });
  });

  app.post("/messages/thread/send", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, sendMessageSchema, async ({ payload, traceId, session, store, userState }) => {
    const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    const rateLimitGuard = await guardMessageRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "thread_send",
      platform: session.platform,
      ...clientContext,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const request: SendMessageRequest = {
      threadId: payload.threadId,
      body: payload.body,
    };
    const response = sendThreadMessage(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    if (response.messageItem.deliveryStatus === "failed") {
      await scheduleMessageRetryJob({
        store,
        userId: session.userId,
        userState,
        messageId: response.messageItem.messageId,
      });
    }
    appendMessageAudit({
      userState,
      actorUserId: session.userId,
      ...clientContext,
      platform: session.platform,
      traceId,
      action: "thread_send",
    });
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies SendMessageResponse);
    });
  });

  app.post("/messages/thread/retry", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, retryMessageSchema, ({ payload, traceId, userState }) => {
    const request: RetryMessageRequest = {
      threadId: payload.threadId,
      messageId: payload.messageId,
    };
    const response = retryThreadMessage(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Retryable message not found.", 404, traceId);
    }
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies RetryMessageResponse);
    });
  });

  app.get("/messages/thread/sync", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, threadIdQuerySchema, async ({ query, traceId, session, store, userState }) => {
    const request: SyncMessageThreadRequest = {
      threadId: query.threadId,
      ...pickDefinedApiFields(query, ["cursor"] as const),
    };
    const response = syncMessageThread(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    await store.saveUserState(session.userId, userState);
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env));
    });
  });
}
