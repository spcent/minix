import type {
  AuthRateLimitState,
  CreateMessageThreadResponse,
  ListMessageThreadsRequest,
  MarkThreadReadRequest,
  RetryMessageRequest,
  RetryMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
  SyncMessageThreadRequest,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiBindings, ApiStore, UserState } from "../../types";
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

export interface RegisterMessageRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardMessageRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    action: "thread_create" | "thread_send";
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
    const query = parseRouteQuery(c, notificationsQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(listNotifications(userState, query, c.env));
  });

  app.post("/notifications/mark-read", async (c) => {
    const payload = await parseRouteBody(c, markNotificationsReadSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { session, store, userState } = await loadRouteUserState(c, resolveStore);
    const response = markNotificationsRead(userState, payload, c.env);
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/messages/unread-badge", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(getUnreadBadge(userState, c.env));
  });

  app.get("/messages/threads", async (c) => {
    const query = parseRouteQuery(c, messageThreadListQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { userState } = await loadRouteUserState(c, resolveStore);
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

  app.get("/messages/thread", async (c) => {
    const query = parseRouteQuery(c, threadIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const response = getMessageThread(userState, {
      threadId: query.threadId,
      ...pickDefinedApiFields(query, ["cursor"] as const),
    }, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env));
  });

  app.post("/messages/thread/create", async (c) => {
    const payload = await parseRouteBody(c, createMessageThreadSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardMessageRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "thread_create",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
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
      clientId,
      ...(deviceId ? { deviceId } : {}),
      platform: session.platform,
      traceId,
      action: "thread_create",
    });
    await store.saveUserState(session.userId, userState);
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies CreateMessageThreadResponse);
  });

  app.post("/messages/thread/read", async (c) => {
    const payload = await parseRouteBody(c, markThreadReadSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const request: MarkThreadReadRequest = { threadId: payload.threadId };
    const response = markThreadRead(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    await store.saveUserState(session.userId, userState);
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env));
  });

  app.post("/messages/thread/send", async (c) => {
    const payload = await parseRouteBody(c, sendMessageSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardMessageRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "thread_send",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
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
      clientId,
      ...(deviceId ? { deviceId } : {}),
      platform: session.platform,
      traceId,
      action: "thread_send",
    });
    await store.saveUserState(session.userId, userState);
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies SendMessageResponse);
  });

  app.post("/messages/thread/retry", async (c) => {
    const payload = await parseRouteBody(c, retryMessageSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const request: RetryMessageRequest = {
      threadId: payload.threadId,
      messageId: payload.messageId,
    };
    const response = retryThreadMessage(userState, request, c.env);
    if (!response) {
      return jsonError("NOT_FOUND", "Retryable message not found.", 404, traceId);
    }
    await store.saveUserState(session.userId, userState);
    return c.json(withMessageRouteUnreadBadge(userState, response, c.env) satisfies RetryMessageResponse);
  });

  app.get("/messages/thread/sync", async (c) => {
    const query = parseRouteQuery(c, threadIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
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
}
