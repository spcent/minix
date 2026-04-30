import { ok } from "@minix/core";
import type {
  ListUserRelationsRequest,
  UserRelationList,
  UserRelationMutationRequest,
  UserRelationTarget,
} from "@minix/contracts";

import type { AccountSection } from "../model";

export function createRelationListSection(relationList: UserRelationList | undefined): AccountSection | undefined {
  if (!relationList || relationList.items.length === 0) {
    return undefined;
  }

  return {
    key: `relation-list-${relationList.kind}`,
    title: `Relationship list: ${relationList.kind}`,
    items: [
      {
        key: `relation-list-${relationList.kind}-summary`,
        label: "List posture",
        value: relationList.summaryLabel ?? `${relationList.pagination.total} items`,
        ...(relationList.availableKinds && relationList.availableKinds.length > 0
          ? { hint: `Available lists: ${relationList.availableKinds.join(", ")}` }
          : {}),
      },
      ...relationList.items.map((item) => ({
        key: `${relationList.kind}-${item.targetUserId}`,
        label: item.displayName,
        value: item.relationshipSummary,
        ...(item.remarkName ? { hint: `Remark: ${item.remarkName}` } : {}),
      })),
    ],
  };
}

export function findAvailableRelationAction(
  relationTargets: UserRelationTarget[] | undefined,
  targetUserId: string,
  kind: UserRelationMutationRequest["action"],
) {
  const target = relationTargets?.find((item) => item.targetUserId === targetUserId);
  const action = target?.actions.find((item) => item.kind === kind);
  if (action && !action.available) {
    return {
      ok: false as const,
      error: {
        code: "FORBIDDEN",
        message: action.blockedReason ?? `${action.label} is unavailable.`,
        recoverable: true,
      },
    };
  }

  return ok({ target, action });
}

export function createRelationListRequestPath(input: ListUserRelationsRequest): string {
  const params = new URLSearchParams({
    kind: input.kind,
    ...(input.page ? { page: String(input.page) } : {}),
    ...(input.pageSize ? { pageSize: String(input.pageSize) } : {}),
    ...(input.keyword ? { keyword: input.keyword } : {}),
  });
  return `/account/relations/list?${params.toString()}`;
}
