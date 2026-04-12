import { jsonError } from "./response";

export function resolveBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/.exec(header);
  return match?.[1] ?? null;
}

export function createUnauthorizedResponse(traceId: string) {
  return jsonError("UNAUTHORIZED", "Access token is missing, invalid, or expired.", 401, traceId);
}
