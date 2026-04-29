import type { Context } from "hono";
import type { ZodType } from "zod";

import { parseJsonBody, parseQuery } from "./parsing";
import type { ApiBindings, ApiStore, SessionRecord, UserState } from "../types";

export function getRouteTraceId(c: Context<any>): string {
  return c.get("traceId");
}

export async function parseRouteBody<SchemaOutput>(
  c: Context<any>,
  schema: ZodType<SchemaOutput>,
): Promise<SchemaOutput | Response> {
  return parseJsonBody(c.req.raw, schema, getRouteTraceId(c));
}

export async function withParsedRouteBody<SchemaOutput, TResult>(
  c: Context<any>,
  schema: ZodType<SchemaOutput>,
  handler: (payload: SchemaOutput) => Promise<TResult> | TResult,
): Promise<TResult | Response> {
  const payload = await parseRouteBody(c, schema);
  if (payload instanceof Response) {
    return payload;
  }

  return handler(payload);
}

export function parseRouteQuery<SchemaOutput>(
  c: Context<any>,
  schema: ZodType<SchemaOutput>,
): SchemaOutput | Response {
  return parseQuery(new URL(c.req.url), schema, getRouteTraceId(c));
}

export function getRouteParam(c: Context<any>, name: string, fallback = ""): string {
  return c.req.param(name) ?? fallback;
}

export function loadRouteSession(c: Context<any>): { traceId: string; session: SessionRecord } {
  return {
    traceId: getRouteTraceId(c),
    session: c.get("session"),
  };
}

export function loadRouteStore(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
): { traceId: string; store: ApiStore } {
  return {
    traceId: getRouteTraceId(c),
    store: resolveStore(c.env),
  };
}

export function loadRouteClientContext(
  c: Context<any>,
  resolveClientId: (request: Request) => string,
  resolveRequestDeviceId: (c: Context<any>) => string | undefined,
): { clientId: string; deviceId?: string } {
  const clientId = resolveClientId(c.req.raw);
  const deviceId = resolveRequestDeviceId(c);

  return {
    clientId,
    ...(deviceId ? { deviceId } : {}),
  };
}

export async function loadRouteUserState(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
): Promise<{
  traceId: string;
  session: SessionRecord;
  store: ApiStore;
  userState: UserState;
}> {
  const traceId = getRouteTraceId(c);
  const session = c.get("session");
  const store = resolveStore(c.env);
  const userState = await store.getUserState(session.userId);
  return { traceId, session, store, userState };
}

export type RouteUserStateContext = Awaited<ReturnType<typeof loadRouteUserState>>;

export async function withRouteUserState<TResult>(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
  handler: (context: RouteUserStateContext) => Promise<TResult> | TResult,
): Promise<TResult> {
  return handler(await loadRouteUserState(c, resolveStore));
}

export async function withRouteUserStateMutation<TResult>(
  c: Context<any>,
  resolveStore: (env: ApiBindings | undefined) => ApiStore,
  handler: (context: RouteUserStateContext) => Promise<TResult> | TResult,
  options: {
    shouldSave?: (result: TResult) => boolean;
  } = {},
): Promise<TResult> {
  const context = await loadRouteUserState(c, resolveStore);
  const result = await handler(context);
  const shouldSave =
    options.shouldSave?.(result) ??
    !(result instanceof Response && result.status >= 400);
  if (shouldSave) {
    await context.store.saveUserState(context.session.userId, context.userState);
  }
  return result;
}
