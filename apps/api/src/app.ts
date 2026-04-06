import { Hono, type Context } from "hono";
import { z } from "zod";

import type {
  AddToBookshelfRequest,
  BookshelfMutationResponse,
  LoadReadingProgressResponse,
  LoginResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RefreshTokenResponse,
  RemoveFromBookshelfRequest,
  SaveReadingProgressRequest,
} from "@minix/contracts";
import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  NOVELS,
  createBookshelf,
  createMembershipOverview,
  deriveReturnTarget,
  listItems,
  listNovels,
  resolveChapterContent,
  resolveChapterList,
  resolveNovelDetail,
} from "./data";
import { checkAuthRateLimit, resolveClientId, type AuthRateLimitConfig, type AuthRateLimitDecision, type RateLimitCounterStore } from "./rate-limit";
import { renderSampleCoverAssetSvg, renderSampleProfileAssetSvg, resolveProfileMedia } from "./sample-assets";
import { createD1ApiStore } from "./store.d1";
import { getGlobalMemoryApiStore } from "./store";
import type { ApiBindings, ApiStore, SessionRecord } from "./types";

declare module "hono" {
  interface ContextVariableMap {
    session: SessionRecord;
    traceId: string;
  }
}

const loginRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  credential: z.object({
    code: z.string().min(1).optional(),
    authCode: z.string().min(1).optional(),
    anonymousId: z.string().min(1).optional(),
  }),
});

const refreshTokenRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  refreshToken: z.string().min(1),
});

const itemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const novelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
  categoryKey: z.string().min(1).optional(),
  status: z.enum(["serializing", "completed", "paused", "all"]).optional(),
  sort: z.enum(["recommended", "updatedAt", "popular", "wordCount"]).optional(),
});

const novelIdQuerySchema = z.object({
  novelId: z.string().min(1),
});

const chapterIdQuerySchema = z.object({
  chapterId: z.string().min(1),
});

const bookshelfMutationSchema = z.object({
  novelId: z.string().min(1),
});

const purchaseMembershipSchema = z.object({
  planId: z.enum(["monthly", "quarterly", "annual"]),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
});

const saveReadingProgressSchema = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().min(1),
  progressPercent: z.number().min(0).max(1),
  scrollOffset: z.number().min(0).optional(),
  pageIndex: z.number().int().min(0).optional(),
});

const DEFAULT_ALLOWED_CORS_ORIGINS = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:4174",
  "http://127.0.0.1:4174",
] as const;
const CORS_ALLOW_HEADERS = "authorization, content-type, x-trace-id";
const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_MAX_AGE_SECONDS = "600";

function createTraceId() {
  return `api_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveTraceId(header: string | undefined): string {
  if (header && header.trim().length > 0) {
    return header.trim();
  }

  return createTraceId();
}

function withTraceHeaders(headers: Record<string, string>, traceId: string) {
  return {
    ...headers,
    "X-Trace-Id": traceId,
  };
}

function jsonError(code: string, message: string, status: number, traceId: string) {
  return Response.json(
    { code, message },
    {
      status,
      headers: withTraceHeaders({}, traceId),
    },
  );
}

function getStore(env: ApiBindings | undefined, overrideStore?: ApiStore): ApiStore {
  if (overrideStore) {
    return overrideStore;
  }

  if (env?.MINIX_STORE) {
    return env.MINIX_STORE;
  }

  if (env?.DB) {
    return createD1ApiStore(env.DB);
  }

  return getGlobalMemoryApiStore();
}

async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>, traceId: string): Promise<T | Response> {
  const body = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request body", 400, traceId);
  }

  return result.data;
}

function parseQuery<T>(url: URL, schema: z.ZodSchema<T>, traceId: string): T | Response {
  const query = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(query);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request query", 400, traceId);
  }

  return result.data;
}

function createUnauthorizedResponse(traceId: string) {
  return jsonError("UNAUTHORIZED", "Access token is missing, invalid, or expired.", 401, traceId);
}

function createSvgResponse(svg: string, traceId: string) {
  return new Response(svg, {
    status: 200,
    headers: withTraceHeaders({
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    }, traceId),
  });
}

function parseSvgAssetId(assetName: string): string | null {
  return assetName.endsWith(".svg") ? assetName.slice(0, -4) : null;
}

function resolveBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/.exec(header);
  return match?.[1] ?? null;
}

export interface CreateApiAppOptions {
  store?: ApiStore;
  allowedOrigins?: string[];
  authRateLimitConfig?: Partial<AuthRateLimitConfig>;
  authRateLimitStore?: RateLimitCounterStore;
}

function parseConfiguredCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readConfiguredCorsOrigins(env?: ApiBindings): string[] {
  const envValue = env?.MINIX_CORS_ALLOWED_ORIGINS;
  if (envValue) {
    return parseConfiguredCorsOrigins(envValue);
  }

  if (typeof process === "undefined") {
    return [];
  }

  return parseConfiguredCorsOrigins(process.env?.MINIX_CORS_ALLOWED_ORIGINS);
}

function resolveAllowedCorsOrigin(origin: string | undefined, configuredOrigins: readonly string[]): string | null {
  if (!origin) {
    return null;
  }

  return configuredOrigins.includes(origin) ? origin : null;
}

function setAuthRateLimitHeaders(c: Context<{ Bindings: ApiBindings }>, decision: AuthRateLimitDecision) {
  c.header("X-RateLimit-Limit", String(decision.limit));
  c.header("X-RateLimit-Remaining", String(decision.remaining));
  c.header("X-RateLimit-Reset", String(decision.resetAt));

  if (decision.limited) {
    c.header("Retry-After", String(decision.retryAfterSeconds));
  }
}

function logAuthEvent(
  event: "login_rate_limited" | "refresh_rate_limited" | "login_failed" | "refresh_failed",
  detail: Record<string, string | number | undefined>,
) {
  console.warn("[minix-api:auth]", JSON.stringify({ event, ...detail }));
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const app = new Hono<{ Bindings: ApiBindings }>();
  const requireSession = async (
    c: Parameters<Parameters<typeof app.use>[1]>[0],
    next: Parameters<Parameters<typeof app.use>[1]>[1],
  ) => {
    const store = getStore(c.env, options.store);
    const token = resolveBearerToken(c.req.header("authorization"));
    if (!token) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const session = await store.getSessionByAccessToken(token);
    if (!session) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    c.set("session", session);
    await next();
  };

  app.use("*", async (c, next) => {
    const traceId = resolveTraceId(c.req.header("x-trace-id"));
    c.set("traceId", traceId);
    const allowedOrigins = Array.from(
      new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...readConfiguredCorsOrigins(c.env), ...(options.allowedOrigins ?? [])]),
    );
    const allowedOrigin = resolveAllowedCorsOrigin(c.req.header("origin"), allowedOrigins);

    if (c.req.method === "OPTIONS") {
      if (!allowedOrigin) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: withTraceHeaders({
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
          "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
          "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
          Vary: "Origin",
        }, traceId),
      });
    }

    await next();

    c.header("X-Trace-Id", traceId);

    if (allowedOrigin) {
      c.header("Access-Control-Allow-Origin", allowedOrigin);
      c.header("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
      c.header("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
      c.header("Access-Control-Max-Age", CORS_MAX_AGE_SECONDS);
      c.header("Vary", "Origin");
    }
  });

  app.get("/", (c) =>
    c.json({
      service: "minix-api",
      status: "ok",
      version: "0.1.0",
    }),
  );

  app.get("/sample-assets/covers/:assetName", (c) => {
    const traceId = c.get("traceId");
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    const svg = renderSampleCoverAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.get("/sample-assets/profiles/:assetName", (c) => {
    const traceId = c.get("traceId");
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    const svg = renderSampleProfileAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.post("/auth/login", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, loginRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = resolveClientId(c.req.raw);
    const rateLimitDecision = await checkAuthRateLimit({
      action: "login",
      platform: payload.platform,
      clientId,
      env: c.env,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
    });
    setAuthRateLimitHeaders(c, rateLimitDecision);
    if (rateLimitDecision.limited) {
      logAuthEvent("login_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return c.json({ code: "RATE_LIMITED", message: "Too many login attempts. Retry later." }, 429);
    }

    if (payload.platform === "wechat" && !payload.credential.code && !payload.credential.authCode) {
      logAuthEvent("login_failed", {
        clientId,
        platform: payload.platform,
        reason: "missing_platform_code",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("LOGIN_FAILED", "wechat login requires a platform code", 400, traceId);
    }

    const store = getStore(c.env, options.store);
    const session = await store.createSession(payload.platform);
    const response: LoginResponse = {
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      profile: resolveProfileMedia(session.profile, c.req.url),
    };

    return c.json(response);
  });

  app.post("/auth/refresh", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, refreshTokenRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = resolveClientId(c.req.raw);
    const rateLimitDecision = await checkAuthRateLimit({
      action: "refresh",
      platform: payload.platform,
      clientId,
      env: c.env,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
    });
    setAuthRateLimitHeaders(c, rateLimitDecision);
    if (rateLimitDecision.limited) {
      logAuthEvent("refresh_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return c.json({ code: "RATE_LIMITED", message: "Too many refresh attempts. Retry later." }, 429);
    }

    const store = getStore(c.env, options.store);
    const session = await store.refreshSession(payload.platform, payload.refreshToken);
    if (!session) {
      logAuthEvent("refresh_failed", {
        clientId,
        platform: payload.platform,
        reason: "invalid_or_expired_refresh_token",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("UNAUTHORIZED", "Refresh token is invalid or expired.", 401, traceId);
    }

    const response: RefreshTokenResponse = {
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      profile: resolveProfileMedia(session.profile, c.req.url),
    };

    return c.json(response);
  });

  app.post("/auth/logout", async (c) => {
    const store = getStore(c.env, options.store);
    const authHeader = c.req.header("authorization");
    const token = resolveBearerToken(authHeader);
    const body = await c.req.json().catch(() => undefined);
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
    await store.revokeSession({
      ...(token ? { accessToken: token } : {}),
      ...(refreshToken ? { refreshToken } : {}),
    });
    return c.json({ loggedOut: true });
  });

  app.use("/items", requireSession);
  app.use("/novels", requireSession);
  app.use("/novels/*", requireSession);
  app.use("/chapters", requireSession);
  app.use("/chapters/*", requireSession);
  app.use("/bookshelf", requireSession);
  app.use("/membership", requireSession);
  app.use("/membership/*", requireSession);
  app.use("/reading-progress", requireSession);

  app.get("/me", async (c) => {
    const store = getStore(c.env, options.store);
    const token = resolveBearerToken(c.req.header("authorization"));
    if (!token) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const session = await store.getSessionByAccessToken(token);
    if (!session) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const userState = await store.getUserState(session.userId);
    return c.json({
      userId: session.userId,
      profile: resolveProfileMedia(session.profile, c.req.url),
      membership: createMembershipOverview(userState.membershipPlanId),
    });
  });

  app.get("/items", (c) => {
    const url = new URL(c.req.url);
    const query = parseQuery(url, itemsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    return c.json(listItems(query.page, query.pageSize));
  });

  app.get("/novels", async (c) => {
    const query = parseQuery(new URL(c.req.url), novelsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const membershipActive = Boolean(userState.membershipPlanId);
    return c.json(listNovels(query, membershipActive, userState, c.req.url));
  });

  app.get("/novels/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const detail = NOVELS.find((item) => item.id === query.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds, c.req.url));
  });

  app.get("/chapters", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_LISTS[query.novelId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter list not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterList(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/chapters/content", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), chapterIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_CONTENT[query.chapterId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter content not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterContent(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/bookshelf", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(createBookshelf(userState, Boolean(userState.membershipPlanId), c.req.url));
  });

  app.post("/bookshelf", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, bookshelfMutationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.add(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: true,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.delete("/bookshelf", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, bookshelfMutationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.delete(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: false,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.get("/membership", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(userState.membershipPlanId ? createMembershipOverview(userState.membershipPlanId) : DEFAULT_MEMBERSHIP_OVERVIEW);
  });

  app.post("/membership/purchase", async (c) => {
    const payload = await parseJsonBody(c.req.raw, purchaseMembershipSchema, c.get("traceId"));
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    userState.membershipPlanId = payload.planId;
    await store.saveUserState(session.userId, userState);

    return c.json({
      purchased: true,
      overview: createMembershipOverview(userState.membershipPlanId),
      returnTarget: deriveReturnTarget(payload.source),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    } satisfies PurchaseMembershipResponse);
  });

  app.get("/reading-progress", async (c) => {
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response: LoadReadingProgressResponse = {
      progress: userState.progressByNovelId[query.novelId] ?? null,
    };
    return c.json(response);
  });

  app.post("/reading-progress", async (c) => {
    const payload = await parseJsonBody(c.req.raw, saveReadingProgressSchema, c.get("traceId"));
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const chapter = CHAPTER_CONTENT[payload.chapterId];
    const updatedAt = new Date().toISOString();
    userState.progressByNovelId[payload.novelId] = {
      novelId: payload.novelId,
      chapterId: payload.chapterId,
      progressPercent: payload.progressPercent,
      updatedAt,
      ...(chapter?.title ? { chapterTitle: chapter.title } : {}),
      ...(payload.pageIndex !== undefined ? { pageIndex: payload.pageIndex } : {}),
      ...(payload.scrollOffset !== undefined ? { scrollOffset: payload.scrollOffset } : {}),
    };
    await store.saveUserState(session.userId, userState);

    return c.json({
      saved: true,
      progress: {
        ...payload,
        updatedAt,
      },
    });
  });

  return app;
}
