import type { ApiStore, SessionRecord } from "../types";

import { jsonError } from "./response";

export interface BearerSessionResolution {
  accessToken?: string;
  session?: SessionRecord;
}

export function resolveBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/.exec(header);
  return match?.[1] ?? null;
}

export async function resolveBearerSession(
  header: string | undefined,
  store: Pick<ApiStore, "getSessionByAccessToken">,
): Promise<BearerSessionResolution> {
  const accessToken = resolveBearerToken(header);
  if (!accessToken) {
    return {};
  }

  const session = await store.getSessionByAccessToken(accessToken);
  return {
    accessToken,
    ...(session ? { session } : {}),
  };
}

export function createUnauthorizedResponse(traceId: string) {
  return jsonError("UNAUTHORIZED", "Access token is missing, invalid, or expired.", 401, traceId);
}
