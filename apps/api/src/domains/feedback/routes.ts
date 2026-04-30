import type {
  FeedbackRevisitResponse,
  FeedbackTicketActionResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
} from "@minix/contracts";

import {
  loadRouteClientContext,
  withRouteUserState,
  withRouteUserStateMutationBody,
  withRouteUserStateQuery,
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
    return withRouteUserState(c, resolveStore, ({ userState }) =>
      c.json(createFeedbackBootstrapResponse(userState)),
    );
  });

  app.get("/feedback/ticket", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, feedbackTicketIdQuerySchema, ({ query, traceId, userState }) => {
    const response = getFeedbackTicket(userState, query.ticketId);
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    return c.json(response);
    });
  });

  app.get("/feedback/tickets", async (c) => {
    return withRouteUserStateQuery(c, resolveStore, feedbackTicketListQuerySchema, ({ query, userState }) => {
    const request: ListFeedbackTicketsRequest = pickDefinedApiFields(query, [
      "page",
      "pageSize",
      "state",
      "categoryKey",
      "keyword",
    ]);
    return c.json(listFeedbackTickets(userState, request) satisfies ListFeedbackTicketsResponse);
    });
  });

  app.post("/feedback/ticket/revisit", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, revisitFeedbackSchema, ({ payload, traceId, userState }) => {
    const response = revisitFeedbackTicket(userState, {
      ticketId: payload.ticketId,
      ...pickDefinedApiFields(payload, ["userMessage"]),
    });
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    return c.json(response satisfies FeedbackRevisitResponse);
    });
  });

  app.post("/feedback/ticket/action", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, feedbackTicketActionSchema, ({ payload, traceId, userState }) => {
    const response = applyFeedbackTicketAction(userState, normalizeFeedbackTicketActionRequest(payload));
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    return c.json(response satisfies FeedbackTicketActionResponse);
    });
  });

  app.post("/feedback", async (c) => {
    return withRouteUserStateMutationBody(c, resolveStore, submitFeedbackSchema, async ({ payload, traceId, session, store, userState }) => {
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
    return c.json(response);
    });
  });
}
