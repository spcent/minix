import type {
  AuthRateLimitState,
  ShareAttributionReportRequest,
  ShareAttributionReportResponse,
  ShareReturnRecognitionRequest,
  ShareShortLinkResolveResponse,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { jsonError } from "../../http/response";
import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import type { ApiBindings, ApiStore, UserState } from "../../types";
import { pickDefinedApiFields } from "../schema-helpers";
import {
  createShareAttributionReport,
  createSharePrepareResponse,
  recognizeShareReturn,
  resolveShareShortLink,
} from "./attribution";
import {
  normalizeSharePrepareRequest,
  shareAttributionReportSchema,
  sharePrepareSchema,
  shareResolveSchema,
  shareReturnRecognitionSchema,
} from "./schemas";

export interface RegisterShareRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardSharePrepareRateLimit: (input: {
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
  appendSharePrepareAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
  }) => void;
}

export function registerShareRoutes(options: RegisterShareRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardSharePrepareRateLimit,
    appendSharePrepareAudit,
  } = options;

  app.use("/share", requireSession);
  app.use("/share/*", requireSession);

  app.post("/share/prepare", async (c) => {
    const payload = await parseRouteBody(c, sharePrepareSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSharePrepareRateLimit({
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

    const response = createSharePrepareResponse(normalizeSharePrepareRequest(payload), c.req.url, undefined, c.env);
    const storageKey = response.shareAttribution.attributionId ?? response.sharePayload.shareToken ?? response.sharePayload.title;
    userState.sharePreparesById[storageKey] = response;
    appendSharePrepareAudit({
      userState,
      actorUserId: session.userId,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/share/resolve", async (c) => {
    const query = parseRouteQuery(c, shareResolveSchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing =
      (query.attributionId ? userState.sharePreparesById[query.attributionId] : undefined) ??
      Object.values(userState.sharePreparesById).find((item) => item.shortLinkRecord?.shortCode === query.shortCode);
    if (!existing) {
      return jsonError("NOT_FOUND", "Share short link was not found.", 404, traceId);
    }

    const response = resolveShareShortLink(existing);
    const nextKey = response.shareAttribution.attributionId ?? response.sharePayload.shareToken ?? existing.sharePayload.title;
    userState.sharePreparesById[nextKey] = {
      ...existing,
      sharePayload: response.sharePayload,
      shareChannel: response.shareChannel,
      shareAttribution: response.shareAttribution,
      landingTarget: response.landingTarget,
      shortLinkRecord: response.shortLinkRecord,
      ...(response.posterAsset ? { posterAsset: response.posterAsset } : {}),
      attributionReport: response.attributionReport,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies ShareShortLinkResolveResponse);
  });

  app.post("/share/return", async (c) => {
    const payload = await parseRouteBody(c, shareReturnRecognitionSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.sharePreparesById[payload.attributionId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Share attribution was not found.", 404, traceId);
    }

    const request: ShareReturnRecognitionRequest = {
      attributionId: payload.attributionId,
      outcome: payload.outcome,
      ...pickDefinedApiFields(payload, ["recognizedPath", "recognizedUserId"]),
    };
    const response = recognizeShareReturn(existing, request);
    userState.sharePreparesById[payload.attributionId] = {
      ...existing,
      sharePayload: response.sharePayload,
      shareChannel: response.shareChannel,
      shareAttribution: response.shareAttribution,
      landingTarget: response.landingTarget ?? existing.landingTarget,
      ...(response.shortLinkRecord ? { shortLinkRecord: response.shortLinkRecord } : {}),
      ...(response.posterAsset ? { posterAsset: response.posterAsset } : {}),
      attributionReport: response.attributionReport,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/share/report", async (c) => {
    const query = parseRouteQuery(c, shareAttributionReportSchema);
    if (query instanceof Response) {
      return query;
    }

    const request: ShareAttributionReportRequest = {
      attributionId: query.attributionId,
    };
    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.sharePreparesById[request.attributionId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Share attribution was not found.", 404, traceId);
    }

    const response = createShareAttributionReport(existing);
    return c.json(response satisfies ShareAttributionReportResponse);
  });
}
