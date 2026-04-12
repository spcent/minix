import { z } from "zod";

import { jsonError } from "./response";

export async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>, traceId: string): Promise<T | Response> {
  const body = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request body", 400, traceId);
  }

  return result.data;
}

export function parseQuery<T>(url: URL, schema: z.ZodSchema<T>, traceId: string): T | Response {
  const query = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(query);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request query", 400, traceId);
  }

  return result.data;
}
