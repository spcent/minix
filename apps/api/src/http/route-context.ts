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

export function parseRouteQuery<SchemaOutput>(
  c: Context<any>,
  schema: ZodType<SchemaOutput>,
): SchemaOutput | Response {
  return parseQuery(new URL(c.req.url), schema, getRouteTraceId(c));
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
