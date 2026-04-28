import type {
  ListUserRelationsRequest,
  UserAvailabilityStatus,
  UserFriendState,
  UserRelationAction,
  UserRelationList,
  UserRelationListItem,
  UserRelationTarget,
} from "@minix/contracts";

import { createApiPaginationWindow } from "../pagination";
import type { UserState } from "../../types";

export function ensureRelationRecords(
  userState: UserState,
): NonNullable<UserState["relationRecordsByUserId"]> {
  if (userState.relationRecordsByUserId) {
    return userState.relationRecordsByUserId;
  }

  const fallback: NonNullable<UserState["relationRecordsByUserId"]> = userState.relationTarget
    ? {
        [userState.relationTarget.targetUserId]: {
          ...userState.relationTarget,
          friendState: userState.relationTarget.friend ? "mutual" : "none",
        },
      }
    : {};
  userState.relationRecordsByUserId = fallback;
  return fallback;
}

function createRelationSummary(record: {
  following: boolean;
  followedBy: boolean;
  friend: boolean;
  friendState?: UserFriendState;
  blocked: boolean;
}): string {
  if (record.blocked) {
    return "Blocked contact";
  }

  if (record.friendState === "incoming_request") {
    return "Incoming friend request";
  }

  if (record.friendState === "outgoing_request") {
    return "Pending friend request";
  }

  if (record.friend || record.friendState === "mutual") {
    return "Mutual connection";
  }

  if (record.following && record.followedBy) {
    return "Mutual follow";
  }

  if (record.following) {
    return "Following";
  }

  if (record.followedBy) {
    return "Follower";
  }

  return "Not following";
}

function createRelationActions(
  record: NonNullable<UserState["relationRecordsByUserId"]>[string],
  availability: UserAvailabilityStatus,
): UserRelationAction[] {
  const actionBlockedReason =
    availability === "enabled"
      ? undefined
      : "Relationship actions are unavailable for the current account status.";
  const actions: UserRelationAction[] = [
    {
      kind: record.following ? "unfollow" : "follow",
      label: record.following ? "Unfollow" : "Follow",
      available: availability === "enabled" && !record.blocked,
      active: record.following,
      ...(availability === "enabled" && !record.blocked
        ? {}
        : { blockedReason: actionBlockedReason ?? "Blocked users cannot be followed." }),
    },
    {
      kind: record.blocked ? "unblock" : "block",
      label: record.blocked ? "Unblock" : "Block",
      available: availability === "enabled",
      active: record.blocked,
      ...(availability === "enabled" || !actionBlockedReason
        ? {}
        : { blockedReason: actionBlockedReason }),
    },
    {
      kind: "set_remark",
      label: record.remarkName ? "Update remark" : "Set remark",
      available: availability === "enabled",
      active: Boolean(record.remarkName),
      requiresInput: true,
      ...(availability === "enabled" || !actionBlockedReason
        ? {}
        : { blockedReason: actionBlockedReason }),
    },
  ];

  if (record.remarkName) {
    actions.push({
      kind: "clear_remark",
      label: "Clear remark",
      available: availability === "enabled",
      active: true,
      ...(availability === "enabled" || !actionBlockedReason
        ? {}
        : { blockedReason: actionBlockedReason }),
    });
  }

  return actions;
}

export function createRelationTarget(
  record: NonNullable<UserState["relationRecordsByUserId"]>[string],
  availability: UserAvailabilityStatus,
): UserRelationTarget {
  return {
    targetUserId: record.targetUserId,
    displayName: record.displayName,
    relationshipSummary: createRelationSummary(record),
    following: record.following,
    followedBy: record.followedBy,
    friend: record.friend,
    ...(record.friendState ? { friendState: record.friendState } : {}),
    blocked: record.blocked,
    ...(record.remarkName ? { remarkName: record.remarkName } : {}),
    actions: createRelationActions(record, availability),
  };
}

export function createPrimaryRelationTargets(
  userState: UserState,
  availability: UserAvailabilityStatus,
): UserRelationTarget[] {
  const records = Object.values(ensureRelationRecords(userState));
  return records
    .sort((left, right) => (right.lastInteractionAt ?? "").localeCompare(left.lastInteractionAt ?? ""))
    .slice(0, 3)
    .map((record) => createRelationTarget(record, availability));
}

export function listUserRelations(
  userState: UserState,
  availability: UserAvailabilityStatus,
  request: ListUserRelationsRequest,
): UserRelationList {
  const keyword = request.keyword?.trim().toLowerCase();
  const records = Object.values(ensureRelationRecords(userState));
  const filtered = records
    .filter((record) => {
      switch (request.kind) {
        case "following":
          return record.following && !record.blocked;
        case "followers":
          return record.followedBy && !record.blocked;
        case "friends":
          return (
            record.friend ||
            record.friendState === "mutual" ||
            record.friendState === "incoming_request" ||
            record.friendState === "outgoing_request"
          );
        case "blocked":
          return record.blocked;
        case "remarks":
          return Boolean(record.remarkName);
      }
    })
    .filter((record) =>
      !keyword
        ? true
        : [record.displayName, record.remarkName ?? "", createRelationSummary(record)].some(
            (value) => value.toLowerCase().includes(keyword),
          ),
    )
    .sort((left, right) => (right.lastInteractionAt ?? "").localeCompare(left.lastInteractionAt ?? ""));
  const availableKinds = [
    "following",
    "followers",
    "friends",
    "blocked",
    "remarks",
  ].filter((kind) =>
    records.some((record) => {
      switch (kind) {
        case "following":
          return record.following && !record.blocked;
        case "followers":
          return record.followedBy && !record.blocked;
        case "friends":
          return (
            record.friend ||
            record.friendState === "mutual" ||
            record.friendState === "incoming_request" ||
            record.friendState === "outgoing_request"
          );
        case "blocked":
          return record.blocked;
        case "remarks":
          return Boolean(record.remarkName);
      }
    }),
  ) as ListUserRelationsRequest["kind"][];

  const pageWindow = createApiPaginationWindow(filtered, {
    page: request.page,
    pageSize: request.pageSize,
    defaultPageSize: 10,
  });
  const items = pageWindow.items.map(
    (record): UserRelationListItem => ({
      ...createRelationTarget(record, availability),
      listKind: request.kind,
      ...(record.lastInteractionAt ? { lastInteractionAt: record.lastInteractionAt } : {}),
    }),
  );

  return {
    kind: request.kind,
    items,
    pagination: {
      page: pageWindow.page,
      pageSize: pageWindow.pageSize,
      hasMore: pageWindow.hasMore,
      total: pageWindow.total,
    },
    summaryLabel:
      filtered.length > 0
        ? `${filtered.length} ${request.kind} relationship records available in the shared account workspace.`
        : `No ${request.kind} relationships match the current filters.`,
    availableKinds,
    ...(request.keyword ? { keyword: request.keyword } : {}),
  };
}

export function applyRelationAction(
  userState: UserState,
  input: {
    targetUserId: string;
    action: "follow" | "unfollow" | "block" | "unblock" | "set_remark" | "clear_remark";
    remarkName?: string;
  },
): string | undefined {
  const relationRecord = ensureRelationRecords(userState)[input.targetUserId];
  if (!relationRecord) {
    return undefined;
  }

  switch (input.action) {
    case "follow":
      relationRecord.following = true;
      relationRecord.friend = relationRecord.followedBy;
      relationRecord.friendState = relationRecord.followedBy ? "mutual" : "outgoing_request";
      break;
    case "unfollow":
      relationRecord.following = false;
      relationRecord.friend = false;
      relationRecord.friendState = relationRecord.followedBy ? "incoming_request" : "none";
      break;
    case "block":
      relationRecord.blocked = true;
      relationRecord.following = false;
      relationRecord.friend = false;
      relationRecord.friendState = "none";
      break;
    case "unblock":
      relationRecord.blocked = false;
      break;
    case "set_remark":
      if (input.remarkName) {
        relationRecord.remarkName = input.remarkName;
      }
      break;
    case "clear_remark":
      delete relationRecord.remarkName;
      break;
  }

  relationRecord.lastInteractionAt = new Date().toISOString();
  if (userState.relationTarget?.targetUserId === relationRecord.targetUserId) {
    userState.relationTarget = {
      ...userState.relationTarget,
      following: relationRecord.following,
      followedBy: relationRecord.followedBy,
      friend: relationRecord.friend,
      ...(relationRecord.friendState ? { friendState: relationRecord.friendState } : {}),
      blocked: relationRecord.blocked,
      ...(relationRecord.remarkName ? { remarkName: relationRecord.remarkName } : {}),
    };
  }

  return input.action === "follow"
    ? "Followed relation target."
    : input.action === "unfollow"
      ? "Unfollowed relation target."
      : input.action === "block"
        ? "Relation target blocked."
        : input.action === "unblock"
          ? "Relation target unblocked."
          : input.action === "set_remark"
            ? "Remark name updated."
            : "Remark name cleared.";
}
