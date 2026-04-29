import type {
  ContentActorRole,
  ContentLifecycle,
  ContentLifecycleAction,
  ContentPermissions,
} from "@minix/contracts";

import type { ManagedContentEntry } from "./managed-content-types";

export function resolveManagedContentActorRole(actorRole: ContentActorRole | undefined): ContentActorRole {
  return actorRole ?? "reader";
}

export function createManagedContentPermissions(
  entry: ManagedContentEntry,
  actorRole: ContentActorRole | undefined,
): ContentPermissions {
  const resolvedActorRole = resolveManagedContentActorRole(actorRole);
  const isAuthor = resolvedActorRole === "author";
  const isReviewer = resolvedActorRole === "reviewer";
  const isAdmin = resolvedActorRole === "admin";

  return {
    actorRole: resolvedActorRole,
    canEdit: isAuthor || isAdmin,
    canSaveDraft: isAuthor || isAdmin,
    canSubmitReview: isAuthor || isAdmin,
    canApproveReview: isReviewer || isAdmin,
    canRejectReview: isReviewer || isAdmin,
    canArchive: isReviewer || isAdmin,
    canDelete: isAuthor || isAdmin,
    canRestore: isReviewer || isAdmin,
    canChangeVisibility: isAuthor || isAdmin,
    canManageAttachments: isAuthor || isAdmin,
    canViewAuditHistory: resolvedActorRole !== "reader",
  };
}

export function createManagedContentLifecycleActions(state: ContentLifecycle["state"]): ContentLifecycleAction[] {
  switch (state) {
    case "published":
      return ["update", "archive", "delete", "change_visibility"];
    case "offline":
      return ["restore", "delete", "change_visibility"];
    case "under_review":
      return ["approve_review", "reject_review", "change_visibility"];
    case "review_rejected":
      return ["update", "submit_review", "delete", "change_visibility"];
    case "deleted":
      return ["restore"];
    case "draft":
    default:
      return ["publish", "update", "submit_review", "delete", "change_visibility"];
  }
}
