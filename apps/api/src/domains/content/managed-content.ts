import type {
  ContentAccess,
  ContentActorRole,
  ContentAttachmentReference,
  ContentAuditEntry,
  ContentAuthoringData,
  ContentCard,
  ContentDetail,
  ContentDetailResponse,
  ContentDisplay,
  ContentGovernanceSummary,
  ContentLifecycle,
  ContentLifecycleAction,
  ContentLifecycleMutationRequest,
  ContentLifecycleMutationResponse,
  ContentPermissions,
  ContentReviewQueue,
  ContentReviewQueueResponse,
  ContentReviewRecord,
  GetContentDetailRequest,
  ListContentReviewQueueRequest,
  SaveContentDraftRequest,
  SaveContentDraftResponse,
} from "@minix/contracts";

import { HOST_ITEMS } from "../../content";
import { bindUploadAssetsToOwner, resolveUploadAssetForUser } from "../uploads/pipeline";
import { cloneDomainSnapshot, cloneDomainSnapshotArray } from "../snapshot";
import type { UserState } from "../../types";

function createManagedContentAuditEntry(input: {
  auditId: string;
  action: ContentAuditEntry["action"];
  actorRole: ContentActorRole;
  actorLabel: string;
  createdAt: string;
  message: string;
}): ContentAuditEntry {
  return {
    auditId: input.auditId,
    action: input.action,
    actorRole: input.actorRole,
    actorLabel: input.actorLabel,
    createdAt: input.createdAt,
    message: input.message,
  };
}

function createManagedContentAttachments(contentId: string, attachmentAssetIds: string[]): ContentAttachmentReference[] {
  return attachmentAssetIds.map((assetId, index) => ({
    assetId,
    kind: "attachment",
    label: `${contentId} attachment ${index + 1}`,
  }));
}

export function createDefaultManagedContentEntries(): NonNullable<UserState["managedContentById"]> {
  return {
    lesson_1: {
      authorUserId: "editorial_author_1",
      model: "article",
      visibility: "public",
      lifecycle: {
        state: "published",
        availableActions: ["update", "archive", "delete", "change_visibility"],
        publishedAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
      },
      authorLabel: "MiniX Editorial",
      title: HOST_ITEMS[0]?.title ?? "Warm-up lesson",
      ...(HOST_ITEMS[0]?.subtitle ? { subtitle: HOST_ITEMS[0].subtitle } : {}),
      summary: HOST_ITEMS[0]?.subtitle ?? "Warm-up content block.",
      bodyPreview: "Published warm-up lesson body preview.",
      categoryKey: "warm-up",
      categoryLabel: "Warm-up",
      tags: [{ key: "article", label: "Article" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_1",
        status: "approved",
        queueLabel: "Editorial review",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-03-31T08:00:00.000Z",
        assignedAt: "2026-03-31T08:10:00.000Z",
        decidedAt: "2026-04-01T08:00:00.000Z",
        message: "Approved for publication.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_1_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Editorial",
          createdAt: "2026-03-31T07:30:00.000Z",
          message: "Initial article draft created.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_1_publish",
          action: "publish",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-01T08:00:00.000Z",
          message: "Article approved and published.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[0]?.title ?? "Warm-up lesson",
        ...(HOST_ITEMS[0]?.subtitle ? { subtitle: HOST_ITEMS[0].subtitle } : {}),
        summary: HOST_ITEMS[0]?.subtitle ?? "Warm-up content block.",
        bodyPreview: "Published warm-up lesson body preview.",
        visibility: "public",
        category: { key: "warm-up", label: "Warm-up" },
        tags: [{ key: "article", label: "Article" }],
        attachmentAssetIds: [],
      },
    },
    lesson_2: {
      authorUserId: "minix_user",
      model: "course",
      visibility: "login_required",
      lifecycle: {
        state: "draft",
        availableActions: ["publish", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-02T08:00:00.000Z",
      },
      authorLabel: "MiniX Curriculum",
      title: HOST_ITEMS[1]?.title ?? "Dialogue practice",
      ...(HOST_ITEMS[1]?.subtitle ? { subtitle: HOST_ITEMS[1].subtitle } : {}),
      summary: HOST_ITEMS[1]?.subtitle ?? "Dialogue content block.",
      bodyPreview: "Draft lesson body preview for dialogue practice.",
      categoryKey: "input",
      categoryLabel: "Input",
      tags: [{ key: "course", label: "Course" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_2",
        status: "not_requested",
        queueLabel: "Draft workspace",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_2_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Curriculum",
          createdAt: "2026-04-02T08:00:00.000Z",
          message: "Course draft created in the CMS workspace.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[1]?.title ?? "Dialogue practice",
        ...(HOST_ITEMS[1]?.subtitle ? { subtitle: HOST_ITEMS[1].subtitle } : {}),
        summary: HOST_ITEMS[1]?.subtitle ?? "Dialogue content block.",
        bodyPreview: "Draft lesson body preview for dialogue practice.",
        visibility: "login_required",
        category: { key: "input", label: "Input" },
        tags: [{ key: "course", label: "Course" }],
        attachmentAssetIds: [],
      },
    },
    lesson_3: {
      authorUserId: "practice_author_1",
      model: "post",
      visibility: "member_only",
      lifecycle: {
        state: "under_review",
        availableActions: ["approve_review", "reject_review", "change_visibility"],
        updatedAt: "2026-04-03T08:00:00.000Z",
        reviewMessage: "Waiting for review approval before publishing.",
      },
      authorLabel: "MiniX Review Queue",
      title: HOST_ITEMS[2]?.title ?? "Practice post",
      ...(HOST_ITEMS[2]?.subtitle ? { subtitle: HOST_ITEMS[2].subtitle } : {}),
      summary: HOST_ITEMS[2]?.subtitle ?? "Practice content block.",
      bodyPreview: "Practice post body preview pending review.",
      categoryKey: "practice",
      categoryLabel: "Practice",
      tags: [{ key: "review", label: "Review" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_3",
        status: "queued",
        queueLabel: "Review queue",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-03T08:00:00.000Z",
        assignedAt: "2026-04-03T08:10:00.000Z",
        message: "Waiting for review approval before publishing.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_3_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Review Queue",
          createdAt: "2026-04-03T07:30:00.000Z",
          message: "Post draft created for review.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_3_submit",
          action: "submit_review",
          actorRole: "author",
          actorLabel: "MiniX Review Queue",
          createdAt: "2026-04-03T08:00:00.000Z",
          message: "Post submitted into the review queue.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[2]?.title ?? "Practice post",
        ...(HOST_ITEMS[2]?.subtitle ? { subtitle: HOST_ITEMS[2].subtitle } : {}),
        summary: HOST_ITEMS[2]?.subtitle ?? "Practice content block.",
        bodyPreview: "Practice post body preview pending review.",
        visibility: "member_only",
        category: { key: "practice", label: "Practice" },
        tags: [{ key: "review", label: "Review" }],
        attachmentAssetIds: [],
      },
    },
    lesson_4: {
      authorUserId: "coaching_author_1",
      model: "consultation_service",
      visibility: "purchased_only",
      lifecycle: {
        state: "review_rejected",
        availableActions: ["update", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-04T08:00:00.000Z",
        reviewMessage: "Needs a clearer service scope before approval.",
      },
      authorLabel: "MiniX Coaching",
      title: HOST_ITEMS[3]?.title ?? "Speaking clinic",
      ...(HOST_ITEMS[3]?.subtitle ? { subtitle: HOST_ITEMS[3].subtitle } : {}),
      summary: HOST_ITEMS[3]?.subtitle ?? "Speaking content block.",
      bodyPreview: "Rejected consultation service draft preview.",
      categoryKey: "speaking",
      categoryLabel: "Speaking",
      tags: [{ key: "service", label: "Service" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_4",
        status: "rejected",
        queueLabel: "Reviewer feedback",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-04T07:40:00.000Z",
        assignedAt: "2026-04-04T07:50:00.000Z",
        decidedAt: "2026-04-04T08:00:00.000Z",
        message: "Needs a clearer service scope before approval.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_4_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Coaching",
          createdAt: "2026-04-04T07:20:00.000Z",
          message: "Consultation service draft created.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_4_reject",
          action: "reject_review",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-04T08:00:00.000Z",
          message: "Review rejected with scope clarification feedback.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[3]?.title ?? "Speaking clinic",
        ...(HOST_ITEMS[3]?.subtitle ? { subtitle: HOST_ITEMS[3].subtitle } : {}),
        summary: HOST_ITEMS[3]?.subtitle ?? "Speaking content block.",
        bodyPreview: "Rejected consultation service draft preview.",
        visibility: "purchased_only",
        category: { key: "speaking", label: "Speaking" },
        tags: [{ key: "service", label: "Service" }],
        attachmentAssetIds: [],
      },
    },
    lesson_5: {
      authorUserId: "ops_author_1",
      model: "tool_config",
      visibility: "public",
      lifecycle: {
        state: "offline",
        availableActions: ["restore", "delete", "change_visibility"],
        updatedAt: "2026-04-05T08:00:00.000Z",
        offlineAt: "2026-04-05T08:00:00.000Z",
      },
      authorLabel: "MiniX Operations",
      title: HOST_ITEMS[4]?.title ?? "Tooling config",
      ...(HOST_ITEMS[4]?.subtitle ? { subtitle: HOST_ITEMS[4].subtitle } : {}),
      summary: HOST_ITEMS[4]?.subtitle ?? "Review content block.",
      bodyPreview: "Offline tooling config preview.",
      categoryKey: "wrap-up",
      categoryLabel: "Wrap-up",
      tags: [{ key: "tool", label: "Tool" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_5",
        status: "approved",
        queueLabel: "Ops review",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-04T08:00:00.000Z",
        assignedAt: "2026-04-04T08:10:00.000Z",
        decidedAt: "2026-04-04T08:30:00.000Z",
        message: "Approved before taking offline for maintenance.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_5_publish",
          action: "publish",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-04T08:30:00.000Z",
          message: "Tool config published.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_5_archive",
          action: "archive",
          actorRole: "admin",
          actorLabel: "Ops Admin",
          createdAt: "2026-04-05T08:00:00.000Z",
          message: "Tool config taken offline for maintenance.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[4]?.title ?? "Tooling config",
        ...(HOST_ITEMS[4]?.subtitle ? { subtitle: HOST_ITEMS[4].subtitle } : {}),
        summary: HOST_ITEMS[4]?.subtitle ?? "Review content block.",
        bodyPreview: "Offline tooling config preview.",
        visibility: "public",
        category: { key: "wrap-up", label: "Wrap-up" },
        tags: [{ key: "tool", label: "Tool" }],
        attachmentAssetIds: [],
      },
    },
  };
}

type ManagedContentEntry = NonNullable<UserState["managedContentById"]>[string];

interface ManagedContentMutationSuccess<TValue> {
  ok: true;
  value: TValue;
}

interface ManagedContentMutationFailure {
  ok: false;
  code: "NOT_FOUND" | "FORBIDDEN";
  message: string;
}

type ManagedContentMutationResult<TValue> = ManagedContentMutationSuccess<TValue> | ManagedContentMutationFailure;

function resolveManagedContentEntry(contentId: string, userState?: UserState): ManagedContentEntry | undefined {
  return userState?.managedContentById?.[contentId] ?? createDefaultManagedContentEntries()[contentId];
}

function cloneManagedContentReviewRecord(reviewRecord: ContentReviewRecord): ContentReviewRecord {
  return cloneDomainSnapshot(reviewRecord);
}

function cloneManagedContentAuditHistory(auditHistory: ContentAuditEntry[]): ContentAuditEntry[] {
  return cloneDomainSnapshotArray(auditHistory);
}

function cloneManagedContentAuthoring(authoring: ContentAuthoringData): ContentAuthoringData {
  return {
    title: authoring.title,
    ...(authoring.subtitle ? { subtitle: authoring.subtitle } : {}),
    summary: authoring.summary,
    ...(authoring.bodyPreview ? { bodyPreview: authoring.bodyPreview } : {}),
    visibility: authoring.visibility,
    category: cloneDomainSnapshot(authoring.category),
    tags: cloneDomainSnapshotArray(authoring.tags),
    ...(authoring.coverAssetId ? { coverAssetId: authoring.coverAssetId } : {}),
    attachmentAssetIds: [...authoring.attachmentAssetIds],
  };
}

function resolveManagedContentActorRole(actorRole: ContentActorRole | undefined): ContentActorRole {
  return actorRole ?? "reader";
}

function createManagedContentPermissions(
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

function createManagedContentLifecycleActions(state: ContentLifecycle["state"]): ContentLifecycleAction[] {
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

function createManagedContentDisplay(contentId: string, userState?: UserState): ContentDisplay | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  return {
    category: {
      key: entry.categoryKey,
      label: entry.categoryLabel,
    },
    tags: cloneDomainSnapshotArray(entry.tags),
    topics: cloneDomainSnapshotArray(entry.tags),
    recommendationSlot: entry.lifecycle.state === "published" ? "editorial" : "related",
    recommendationSlotLabel: entry.lifecycle.state === "published" ? "Managed Frontlist" : "Lifecycle Queue",
    recommendationSummary:
      entry.lifecycle.state === "published"
        ? "This item stays in the managed editorial lane for discover-first surfaces."
        : "This item stays visible through lifecycle-aware recommendation lanes until publication posture changes.",
    laneGovernanceSummary:
      entry.lifecycle.state === "published"
        ? "Editorial lane governance keeps published managed content pinned to shared frontlist surfaces."
        : "Lifecycle lane governance keeps draft and review-state content discoverable for authorized workflows only.",
    pinned: entry.lifecycle.state === "published",
    featured: entry.lifecycle.state === "under_review" || entry.lifecycle.state === "review_rejected",
  };
}

function resolveManagedContentCoverUrl(entry: ManagedContentEntry, userState?: UserState): string | undefined {
  return entry.coverAssetId && userState ? resolveUploadAssetForUser(userState, entry.coverAssetId)?.url : undefined;
}

function resolveManagedContentAttachments(
  entry: ManagedContentEntry,
  userState?: UserState,
): ContentAttachmentReference[] {
  return entry.attachments.map((attachment) => {
    const asset = userState ? resolveUploadAssetForUser(userState, attachment.assetId) : undefined;
    return {
      assetId: attachment.assetId,
      kind: attachment.kind,
      label: attachment.label,
      ...(asset?.url ? { url: asset.url } : {}),
      ...(asset?.thumbnailUrl ? { thumbnailUrl: asset.thumbnailUrl } : {}),
      ...(asset?.ownershipSummary ? { assetSummary: asset.ownershipSummary } : {}),
      ...(asset?.derivedAssetSummary ? { derivedAssetSummary: asset.derivedAssetSummary } : {}),
    };
  });
}

function createManagedContentAttachmentSummary(attachments: ContentAttachmentReference[]): string | undefined {
  if (attachments.length === 0) {
    return undefined;
  }
  return `${attachments.length} attachment reference${attachments.length === 1 ? "" : "s"} stay inside the shared content envelope, with derived asset posture exposed additively.`;
}

function createManagedContentModerationSummary(entry: ManagedContentEntry): string {
  if (entry.reviewRecord.status === "approved") {
    return "Moderation posture is approved and the item can stay in the managed recommendation lanes.";
  }
  if (entry.reviewRecord.status === "queued") {
    return "Moderation posture is queued in the shared editorial review workflow.";
  }
  if (entry.reviewRecord.status === "rejected") {
    return "Moderation posture is rejected and follow-up stays in the shared review workflow.";
  }
  return "Moderation posture remains in draft and can be promoted through the shared review workflow.";
}

function createManagedContentGovernanceSummary(
  entry: ManagedContentEntry,
  attachments: ContentAttachmentReference[],
  access?: ContentAccess,
): ContentGovernanceSummary {
  const queueLabel = entry.reviewRecord.queueLabel ?? "Draft workspace";
  return {
    reviewQueueSummary:
      entry.reviewRecord.status === "queued"
        ? `${queueLabel} is tracking this item for reviewer action.`
        : `${queueLabel} records the latest review state: ${entry.reviewRecord.status}.`,
    lifecycleSummary: `Lifecycle state is ${entry.lifecycle.state}; available actions are ${entry.lifecycle.availableActions.join(", ") || "none"}.`,
    attachmentGovernanceSummary:
      attachments.length > 0
        ? `${attachments.length} attachment reference(s) reuse upload ownership and derived asset summaries.`
        : "No attachment references are bound to this content item.",
    laneGovernanceSummary:
      entry.lifecycle.state === "published"
        ? "Editorial lane governance keeps published content in shared recommendation lanes."
        : "Lifecycle lane governance keeps non-published content inside authorized workflows.",
    auditSummary: `${entry.auditHistory.length} authoring audit event(s) are attached to this content item.`,
    accessSummary:
      access?.summaryLabel ??
      (entry.visibility === "public"
        ? "Visible to everyone."
        : "Visibility is governed by the shared content access contract."),
  };
}

export function createManagedContentCard(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentCard | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  const display = createManagedContentDisplay(contentId, userState);
  if (!entry || !display) {
    return undefined;
  }
  const coverUrl = resolveManagedContentCoverUrl(entry, userState);
  const attachments = resolveManagedContentAttachments(entry, userState);
  const moderationSummary = createManagedContentModerationSummary(entry);
  const attachmentSummary = createManagedContentAttachmentSummary(attachments);
  const access = createManagedContentAccess(contentId, userState, actorRole);
  const governanceSummary = createManagedContentGovernanceSummary(entry, attachments, access);

  return {
    contentId,
    model: entry.model,
    title: entry.title,
    ...(entry.subtitle ? { subtitle: entry.subtitle } : {}),
    summary: entry.summary,
    ...(coverUrl ? { coverUrl } : {}),
    authorLabel: entry.authorLabel,
    display,
    lifecycle: {
      ...entry.lifecycle,
      availableActions: [...entry.lifecycle.availableActions],
      moderationSummary,
    },
    ...(actorRole && entry.reviewRecord
      ? {
          reviewRecord: {
            ...cloneManagedContentReviewRecord(entry.reviewRecord),
            moderationSummary,
          },
        }
      : {}),
    moderationSummary,
    ...(attachmentSummary ? { attachmentSummary } : {}),
    governanceSummary,
  };
}

export function createManagedContentAccess(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentAccess | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  const resolvedActorRole = resolveManagedContentActorRole(actorRole);
  const privileged = resolvedActorRole !== "reader";
  const published = entry.lifecycle.state === "published";
  const hasMembership = Boolean(userState?.membershipPlanId);
  const purchased = Boolean(userState?.latestPaidOrderId);
  const visibilityAccessible =
    entry.visibility === "public" ||
    entry.visibility === "login_required" ||
    (entry.visibility === "member_only" && hasMembership) ||
    (entry.visibility === "purchased_only" && purchased);

  return {
    visibility: entry.visibility,
    accessible: entry.lifecycle.state !== "deleted" && (privileged || (published && visibilityAccessible)),
    previewAvailable: entry.lifecycle.state !== "deleted",
    requiresLogin: entry.visibility === "login_required",
    requiresMembership: entry.visibility === "member_only",
    requiresPurchase: entry.visibility === "purchased_only",
    ...(entry.visibility === "purchased_only" ? { purchased } : {}),
    summaryLabel:
      !published && !privileged
        ? "Not yet available to readers."
        : entry.visibility === "public"
          ? "Visible to everyone."
          : entry.visibility === "login_required"
            ? "Visible after sign-in."
            : entry.visibility === "member_only"
              ? "Visible to members only."
              : "Visible after purchase only.",
    ...(entry.visibility === "member_only"
      ? { entitlementLabel: "Membership access" }
      : entry.visibility === "purchased_only"
        ? { entitlementLabel: "Purchase access" }
        : {}),
    ...(!published && !privileged
      ? { gateLabel: "Content is unavailable until review and publication are complete." }
      : entry.visibility !== "public"
        ? { gateLabel: "Access is gated by the current visibility rule." }
        : {}),
  };
}

function createManagedContentDetail(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentDetail | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  const card = createManagedContentCard(contentId, userState, actorRole);
  if (!card || !entry) {
    return undefined;
  }

  const permissions = createManagedContentPermissions(entry, actorRole);
  const attachments = resolveManagedContentAttachments(entry, userState);
  const moderationSummary = createManagedContentModerationSummary(entry);
  const attachmentSummary = createManagedContentAttachmentSummary(attachments);
  const access = createManagedContentAccess(contentId, userState, actorRole);
  const governanceSummary = createManagedContentGovernanceSummary(entry, attachments, access);

  return {
    ...card,
    recommendationReason: `Lifecycle status: ${card.lifecycle.state}.`,
    bodyPreview: entry.bodyPreview ?? `${card.summary} Lifecycle state: ${card.lifecycle.state}.`,
    ...(actorRole && actorRole !== "reader" ? { authoring: cloneManagedContentAuthoring(entry.authoring) } : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
    reviewRecord: {
      ...cloneManagedContentReviewRecord(entry.reviewRecord),
      moderationSummary,
    },
    permissions,
    ...(permissions.canViewAuditHistory ? { auditHistory: cloneManagedContentAuditHistory(entry.auditHistory) } : {}),
    moderationSummary,
    ...(attachmentSummary ? { attachmentSummary } : {}),
    governanceSummary,
  };
}

export function getManagedContentDetail(
  input: string | GetContentDetailRequest,
  userState: UserState,
): ContentDetailResponse | undefined {
  const request = typeof input === "string" ? { contentId: input } : input;
  const contentDetail = createManagedContentDetail(request.contentId, userState, request.actorRole);
  const contentAccess = createManagedContentAccess(request.contentId, userState, request.actorRole);
  if (!contentDetail || !contentAccess) {
    return undefined;
  }

  return {
    contentDetail,
    contentAccess,
    ...(contentDetail.governanceSummary ? { governanceSummary: contentDetail.governanceSummary } : {}),
  };
}

function createManagedContentQueue(
  userState: UserState,
  input: ListContentReviewQueueRequest = {},
): ContentReviewQueue {
  const items = Object.entries(userState.managedContentById ?? createDefaultManagedContentEntries())
    .filter(([, entry]) => (input.state && input.state !== "all" ? entry.lifecycle.state === input.state : true))
    .filter(([, entry]) => entry.reviewRecord.status === "queued" || entry.lifecycle.state === "under_review")
    .sort((left, right) => (right[1].reviewRecord.submittedAt ?? "").localeCompare(left[1].reviewRecord.submittedAt ?? ""))
    .map(([contentId, entry]) => ({
      contentId,
      model: entry.model,
      title: entry.title,
      lifecycleState: entry.lifecycle.state,
      visibility: entry.visibility,
      authorLabel: entry.authorLabel,
      queueLabel: entry.reviewRecord.queueLabel ?? "Review queue",
      attachmentsCount: entry.attachments.length,
      ...(entry.reviewRecord.submittedAt ? { submittedAt: entry.reviewRecord.submittedAt } : {}),
      ...(entry.reviewRecord.reviewerLabel ? { reviewerLabel: entry.reviewRecord.reviewerLabel } : {}),
      moderationSummary: createManagedContentModerationSummary(entry),
    }));
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length,
    ...(pagedItems[0] ? { selectedContentId: pagedItems[0].contentId } : {}),
  };
}

export function listManagedContentReviewQueue(
  userState: UserState,
  input: ListContentReviewQueueRequest = {},
): ContentReviewQueueResponse {
  const entries = Object.values(userState.managedContentById ?? createDefaultManagedContentEntries());
  const queuedCount = entries.filter((entry) => entry.reviewRecord.status === "queued").length;
  const attachmentCount = entries.reduce((total, entry) => total + entry.attachments.length, 0);
  return {
    reviewQueue: createManagedContentQueue(userState, input),
    governanceSummary: {
      reviewQueueSummary: `${queuedCount} content item(s) are currently queued for editorial review.`,
      lifecycleSummary: "Review queue output stays normalized across draft, under-review, and rejected lifecycle states.",
      attachmentGovernanceSummary: `${attachmentCount} attachment reference(s) are visible through content review metadata.`,
      laneGovernanceSummary: "Editorial and lifecycle lanes remain inside the shared content domain.",
      auditSummary: "Authoring audit history remains attached to each managed content detail.",
      accessSummary: "Review queue visibility is limited to authorized content roles.",
    },
  };
}

function createManagedContentResponse(
  contentId: string,
  userState: UserState,
  actorRole?: ContentActorRole,
  transitionMessage = "Content updated.",
): ManagedContentMutationResult<ContentLifecycleMutationResponse | SaveContentDraftResponse> {
  const contentCard = createManagedContentCard(contentId, userState, actorRole);
  const contentDetail = createManagedContentDetail(contentId, userState, actorRole);
  const contentAccess = createManagedContentAccess(contentId, userState, actorRole);
  if (!contentCard || !contentDetail || !contentAccess) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Managed content not found.",
    };
  }

  return {
    ok: true,
    value: {
      contentCard,
      contentDetail,
      contentAccess,
      ...(contentDetail.governanceSummary ? { governanceSummary: contentDetail.governanceSummary } : {}),
      transitionMessage,
    },
  };
}

function ensureManagedContentState(userState: UserState) {
  if (!userState.managedContentById) {
    userState.managedContentById = createDefaultManagedContentEntries();
  }
}

export function saveManagedContentDraft(
  userState: UserState,
  input: SaveContentDraftRequest,
): ManagedContentMutationResult<SaveContentDraftResponse> {
  ensureManagedContentState(userState);
  const managedContentById = userState.managedContentById!;
  const now = new Date().toISOString();
  const contentId = input.contentId ?? `content_${crypto.randomUUID()}`;
  const current = input.contentId ? resolveManagedContentEntry(contentId, userState) : undefined;
  const actorRole = resolveManagedContentActorRole(input.actorRole ?? "author");
  if (current) {
    const permissions = createManagedContentPermissions(current, actorRole);
    if (!permissions.canSaveDraft) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Current role cannot save this content draft.",
      };
    }
  }

  const attachmentAssetIds = input.attachmentAssetIds ?? current?.authoring.attachmentAssetIds ?? [];
  const next: ManagedContentEntry = {
    authorUserId: current?.authorUserId ?? "minix_user",
    model: input.model,
    visibility: input.visibility,
    lifecycle: {
      ...(current?.lifecycle ?? { state: "draft", availableActions: createManagedContentLifecycleActions("draft") }),
      state:
        current?.lifecycle.state === "published" || current?.lifecycle.state === "offline" || current?.lifecycle.state === "deleted"
          ? current.lifecycle.state
          : "draft",
      availableActions: createManagedContentLifecycleActions(
        current?.lifecycle.state === "published" || current?.lifecycle.state === "offline" || current?.lifecycle.state === "deleted"
          ? current.lifecycle.state
          : "draft",
      ),
      updatedAt: now,
      ...(current?.lifecycle.publishedAt ? { publishedAt: current.lifecycle.publishedAt } : {}),
      ...(current?.lifecycle.offlineAt ? { offlineAt: current.lifecycle.offlineAt } : {}),
    },
    authorLabel: current?.authorLabel ?? "MiniX Author Workspace",
    title: input.title,
    ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    summary: input.summary,
    ...(input.bodyPreview ? { bodyPreview: input.bodyPreview } : {}),
    categoryKey: input.categoryKey,
    categoryLabel: input.categoryLabel,
    tags: input.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    ...(input.coverAssetId ? { coverAssetId: input.coverAssetId } : {}),
    attachments: createManagedContentAttachments(contentId, attachmentAssetIds),
    reviewRecord: {
      ...(current?.reviewRecord ?? {
        reviewId: `review_${contentId}`,
        status: "not_requested" as ContentReviewRecord["status"],
        queueLabel: "Draft workspace",
      }),
      ...(current?.reviewRecord.decidedAt ? { decidedAt: current.reviewRecord.decidedAt } : {}),
      ...(current?.reviewRecord.reviewerLabel ? { reviewerLabel: current.reviewRecord.reviewerLabel } : {}),
      ...(current?.reviewRecord.assignedAt ? { assignedAt: current.reviewRecord.assignedAt } : {}),
      ...(current?.reviewRecord.submittedAt ? { submittedAt: current.reviewRecord.submittedAt } : {}),
    },
    auditHistory: [
      ...(current?.auditHistory ? cloneManagedContentAuditHistory(current.auditHistory) : []),
      createManagedContentAuditEntry({
        auditId: `audit_${contentId}_${current ? "save" : "create"}_${Date.now()}`,
        action: current ? "save_draft" : "create",
        actorRole,
        actorLabel: current?.authorLabel ?? "MiniX Author Workspace",
        createdAt: now,
        message: current ? "Draft saved with the latest authoring changes." : "Draft created in the CMS authoring workspace.",
      }),
    ],
    actorRoles: current?.actorRoles ?? ["author", "reviewer", "admin", "reader"],
    authoring: {
      title: input.title,
      ...(input.subtitle ? { subtitle: input.subtitle } : {}),
      summary: input.summary,
      ...(input.bodyPreview ? { bodyPreview: input.bodyPreview } : {}),
      visibility: input.visibility,
      category: { key: input.categoryKey, label: input.categoryLabel },
      tags: input.tags.map((tag) => ({ key: tag.key, label: tag.label })),
      ...(input.coverAssetId ? { coverAssetId: input.coverAssetId } : {}),
      attachmentAssetIds: [...attachmentAssetIds],
    },
  };

  managedContentById[contentId] = next;
  if (input.coverAssetId) {
    bindUploadAssetsToOwner(userState, {
      assetIds: [input.coverAssetId],
      ownerType: "content",
      ownerId: contentId,
      role: "cover",
      now,
    });
  }
  bindUploadAssetsToOwner(userState, {
    assetIds: attachmentAssetIds,
    ownerType: "content",
    ownerId: contentId,
    role: "attachment",
    now,
  });

  const response = createManagedContentResponse(
    contentId,
    userState,
    actorRole,
    current ? "Content draft saved." : "Content draft created.",
  );
  return response.ok ? { ok: true, value: response.value as SaveContentDraftResponse } : response;
}

export function applyManagedContentLifecycle(
  userState: UserState,
  input: ContentLifecycleMutationRequest,
): ManagedContentMutationResult<ContentLifecycleMutationResponse> {
  const current = resolveManagedContentEntry(input.contentId, userState);
  if (!current) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Managed content not found.",
    };
  }

  ensureManagedContentState(userState);

  const actorRole = resolveManagedContentActorRole(input.actorRole);
  const permissions = createManagedContentPermissions(current, actorRole);
  const next = cloneDomainSnapshot(current);
  const now = new Date().toISOString();

  switch (input.action) {
    case "publish":
      if (!(actorRole === "admin" || actorRole === "author")) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot publish content." };
      }
      next.lifecycle.state = "published";
      next.reviewRecord.status = "approved";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = "Published from the sample CMS workflow.";
      delete next.lifecycle.offlineAt;
      delete next.lifecycle.reviewMessage;
      break;
    case "archive":
      if (!permissions.canArchive) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot archive content." };
      }
      next.lifecycle.state = "offline";
      next.lifecycle.offlineAt = now;
      next.reviewRecord.queueLabel = "Offline queue";
      break;
    case "delete":
      if (!permissions.canDelete) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot delete content." };
      }
      next.lifecycle.state = "deleted";
      break;
    case "restore":
      if (!permissions.canRestore) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot restore content." };
      }
      next.lifecycle.state = "published";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.offlineAt;
      next.reviewRecord.status = "approved";
      next.reviewRecord.decidedAt = now;
      break;
    case "submit_review":
      if (!permissions.canSubmitReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot submit content for review." };
      }
      next.lifecycle.state = "under_review";
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Submitted for review.";
      next.reviewRecord.status = "queued";
      next.reviewRecord.queueLabel = "Review queue";
      next.reviewRecord.submittedAt = now;
      next.reviewRecord.assignedAt = now;
      next.reviewRecord.reviewerLabel = "Reviewer Mina";
      next.reviewRecord.message = input.reviewMessage ?? "Submitted for review.";
      next.auditHistory.push(
        createManagedContentAuditEntry({
          auditId: `audit_${input.contentId}_assign_${Date.now()}`,
          action: "assign_review",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: now,
          message: "Content assigned into the review queue.",
        }),
      );
      break;
    case "approve_review":
      if (!permissions.canApproveReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot approve content review." };
      }
      next.lifecycle.state = "published";
      next.reviewRecord.status = "approved";
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = input.reviewMessage ?? "Review approved.";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.reviewMessage;
      break;
    case "reject_review":
      if (!permissions.canRejectReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot reject content review." };
      }
      next.lifecycle.state = "review_rejected";
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Review rejected in sample workflow.";
      next.reviewRecord.status = "rejected";
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = input.reviewMessage ?? "Review rejected in sample workflow.";
      break;
    case "change_visibility":
      if (!permissions.canChangeVisibility) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot change content visibility." };
      }
      if (input.visibility) {
        next.visibility = input.visibility;
        next.authoring.visibility = input.visibility;
      }
      break;
    case "update":
      if (!permissions.canEdit) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot update content." };
      }
      if (input.reviewMessage) {
        next.summary = input.reviewMessage;
        next.authoring.summary = input.reviewMessage;
      }
      break;
  }

  next.lifecycle.availableActions = createManagedContentLifecycleActions(next.lifecycle.state);
  next.lifecycle.updatedAt = now;
  next.auditHistory.push(
    createManagedContentAuditEntry({
      auditId: `audit_${input.contentId}_${input.action}_${Date.now()}`,
      action: input.action,
      actorRole,
      actorLabel:
        actorRole === "reviewer" ? "Reviewer Mina" : actorRole === "admin" ? "Ops Admin" : current.authorLabel,
      createdAt: now,
      message:
        input.action === "change_visibility"
          ? `Visibility changed to ${next.visibility}.`
          : input.reviewMessage ?? `Lifecycle action ${input.action} applied.`,
    }),
  );
  userState.managedContentById![input.contentId] = next;

  const response = createManagedContentResponse(
    input.contentId,
    userState,
    actorRole,
    input.action === "change_visibility"
      ? "Content visibility updated."
      : input.action === "submit_review"
        ? "Content submitted for review."
        : input.action === "approve_review"
          ? "Content review approved."
          : input.action === "reject_review"
            ? "Content review rejected."
            : input.action === "archive"
              ? "Content archived."
              : input.action === "restore"
                ? "Content restored."
                : input.action === "delete"
                  ? "Content deleted."
                  : input.action === "publish"
                    ? "Content published."
                    : "Content updated.",
  );
  return response.ok ? { ok: true, value: response.value as ContentLifecycleMutationResponse } : response;
}
