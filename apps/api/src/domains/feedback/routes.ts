import type {
  FeedbackRevisitResponse,
  FeedbackTicketActionResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
} from "@minix/contracts";

import {
  loadRouteClientContext,
  loadRouteUserState,
  parseRouteBody,
  parseRouteQuery,
} from "../../http/route-context";
import { jsonError } from "../../http/response";
import type { UserState } from "../../types";
import type {
  ApiClientContextRouteOptions,
  ApiClientStampedRateLimitGuardResult,
  ApiRateLimitGuardInput,
  ApiRouteBaseOptions,
} from "../route-options";
import { pickDefinedApiFields } from "../schema-helpers";
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

export interface RegisterFeedbackRoutesOptions extends ApiRouteBaseOptions, ApiClientContextRouteOptions {
  guardFeedbackSubmitRateLimit: (input: ApiRateLimitGuardInput) => ApiClientStampedRateLimitGuardResult;
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
    const request: ListFeedbackTicketsRequest = pickDefinedApiFields(query, [
      "page",
      "pageSize",
      "state",
      "categoryKey",
      "keyword",
    ]);
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
      ...pickDefinedApiFields(payload, ["userMessage"]),
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
    const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    const rateLimitGuard = await guardFeedbackSubmitRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      platform: session.platform,
      ...clientContext,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    const response = submitFeedbackTicket(session, userState, normalizeSubmitFeedbackRequest(payload));
    appendFeedbackSubmitAudit({
      userState,
      actorUserId: session.userId,
      ...clientContext,
      platform: session.platform,
      traceId,
      ticketId: response.feedbackTicket.ticketId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });
}
