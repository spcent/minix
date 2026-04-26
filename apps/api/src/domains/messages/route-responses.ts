import type { UnreadBadge } from "@minix/contracts";

import type { UserState } from "../../types";
import type { NotificationChannelProviderRuntimeEnv } from "../settings/state";
import { getUnreadBadge } from "./notifications";

export interface MessageRouteUnreadBadgeResponse {
  unreadBadge: UnreadBadge;
}

export function withMessageRouteUnreadBadge<TResponse extends MessageRouteUnreadBadgeResponse>(
  userState: UserState,
  response: TResponse,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): TResponse {
  response.unreadBadge = getUnreadBadge(userState, runtimeEnv);
  return response;
}
