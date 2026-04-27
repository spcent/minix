import type {
  ListUserAssetHistoryRequest,
  UserAssetHistoryResponse,
  UserRelationListResponse,
  UserRelationMutationResponse,
} from "@minix/contracts";

import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { jsonError } from "../../http/response";
import { pickDefinedApiFields } from "../schema-helpers";
import { createCurrentUserResponse, listUserAssetHistory } from "./current-user";
import { applyRelationAction, listUserRelations } from "./relations";
import type { RegisterAccountRoutesOptions } from "./route-options";
import {
  assetHistoryQuerySchema,
  relationActionSchema,
  relationListQuerySchema,
} from "./schemas";

export function registerAccountRelationsRoutes(options: RegisterAccountRoutesOptions) {
  const { app, resolveStore } = options;

  app.get("/account/relations/list", async (c) => {
    const query = parseRouteQuery(c, relationListQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { session, userState } = await loadRouteUserState(c, resolveStore);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationListResponse = {
      accountSummary: current.accountSummary,
      userStatus: current.userStatus,
      accountWorkspaceSummary: current.accountWorkspaceSummary,
      relationList: listUserRelations(userState, current.userStatus.availability, {
        kind: query.kind,
        ...pickDefinedApiFields(query, ["page", "pageSize", "keyword"]),
      }),
    };
    return c.json(response);
  });

  app.get("/account/assets/history", async (c) => {
    const query = parseRouteQuery(c, assetHistoryQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { session, userState } = await loadRouteUserState(c, resolveStore);
    const response: UserAssetHistoryResponse = listUserAssetHistory(session, userState, {
      ...pickDefinedApiFields(query, ["page", "pageSize", "subject"]),
    } satisfies ListUserAssetHistoryRequest);
    return c.json(response);
  });

  app.post("/account/relations", async (c) => {
    const payload = await parseRouteBody(c, relationActionSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const target =
      current.relationTargets.find((item) => item.targetUserId === payload.targetUserId) ??
      listUserRelations(userState, current.userStatus.availability, {
        kind: payload.listKind ?? "following",
        page: 1,
        pageSize: 100,
        ...pickDefinedApiFields(payload, ["keyword"]),
      }).items.find((item) => item.targetUserId === payload.targetUserId);
    if (!target) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    const action = target.actions.find((item) => item.kind === payload.action);
    if (!action?.available) {
      return jsonError(
        "FORBIDDEN",
        action?.blockedReason ?? "Relation action is unavailable.",
        409,
        traceId,
      );
    }
    if (payload.action === "set_remark" && !payload.remarkName) {
      return jsonError(
        "INVALID_ARGUMENT",
        "remark name is required when setting a remark",
        400,
        traceId,
      );
    }

    const transitionMessage = applyRelationAction(userState, {
      targetUserId: payload.targetUserId,
      action: payload.action,
      ...pickDefinedApiFields(payload, ["remarkName"]),
    });
    if (!transitionMessage) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationMutationResponse = {
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      accountWorkspaceSummary: next.accountWorkspaceSummary,
      relationTargets: next.relationTargets,
      ...(payload.listKind
        ? {
            relationList: listUserRelations(userState, next.userStatus.availability, {
              kind: payload.listKind,
              ...pickDefinedApiFields(payload, ["page", "pageSize", "keyword"]),
            }),
          }
        : {}),
      transitionMessage,
    };
    return c.json(response);
  });
}
