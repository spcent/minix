import type {
  AuthRateLimitState,
  FeedbackRevisitResponse,
  FeedbackTicketActionResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { ApiBindings, ApiStore, UserState } from "../../types";
import { createFeedbackBootstrapResponse } from "./support";
import {
  applyFeedbackTicketAction,
  getFeedbackTicket,
  listFeedbackTickets,
  revisitFeedbackTicket,
  submitFeedbackTicket,
} from "./tickets";
import {
  feedbackTicketActionSchema,
  feedbackTicketIdQuerySchema,
  feedbackTicketListQuerySchema,
  normalizeFeedbackTicketActionRequest,
  normalizeSubmitFeedbackRequest,
  revisitFeedbackSchema,
  submitFeedbackSchema,
} from "./schemas";

export interface RegisterFeedbackRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardFeedbackSubmitRateLimit: (input: {
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
  appendFeedbackSubmitAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
    ticketId: string;
  }) => void;
}

export function registerFeedbackRoutes(options: RegisterFeedbackRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardFeedbackSubmitRateLimit,
    appendFeedbackSubmitAudit,
  } = options;

  app.use("/feedback", requireSession);
  app.use("/feedback/*", requireSession);

  app.get("/feedback/bootstrap", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(createFeedbackBootstrapResponse(userState));
  });

  app.get("/feedback/ticket", async (c) => {
    const query = parseRouteQuery(c, feedbackTicketIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const response = getFeedbackTicket(userState, query.ticketId);
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    return c.json(response);
  });

  app.get("/feedback/tickets", async (c) => {
    const query = parseRouteQuery(c, feedbackTicketListQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { userState } = await loadRouteUserState(c, resolveStore);
    const request: ListFeedbackTicketsRequest = {
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      ...(query.state !== undefined ? { state: query.state } : {}),
      ...(query.categoryKey !== undefined ? { categoryKey: query.categoryKey } : {}),
      ...(query.keyword !== undefined ? { keyword: query.keyword } : {}),
    };
    return c.json(listFeedbackTickets(userState, request) satisfies ListFeedbackTicketsResponse);
  });

  app.post("/feedback/ticket/revisit", async (c) => {
    const payload = await parseRouteBody(c, revisitFeedbackSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const response = revisitFeedbackTicket(userState, {
      ticketId: payload.ticketId,
      ...(payload.userMessage !== undefined ? { userMessage: payload.userMessage } : {}),
    });
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies FeedbackRevisitResponse);
  });

  app.post("/feedback/ticket/action", async (c) => {
    const payload = await parseRouteBody(c, feedbackTicketActionSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const response = applyFeedbackTicketAction(userState, normalizeFeedbackTicketActionRequest(payload));
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies FeedbackTicketActionResponse);
  });

  app.post("/feedback", async (c) => {
    const payload = await parseRouteBody(c, submitFeedbackSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardFeedbackSubmitRateLimit({
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

    const response = submitFeedbackTicket(session, userState, normalizeSubmitFeedbackRequest(payload));
    appendFeedbackSubmitAudit({
      userState,
      actorUserId: session.userId,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      platform: session.platform,
      traceId,
      ticketId: response.feedbackTicket.ticketId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });
}
