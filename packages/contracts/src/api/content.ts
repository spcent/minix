export const CONTENT_MODELS = [
  "article",
  "course",
  "consultation_service",
  "tool_config",
  "post",
  "event",
  "novel_story",
] as const;
export type ContentModel = (typeof CONTENT_MODELS)[number];

export const CONTENT_PUBLICATION_STATES = [
  "draft",
  "published",
  "offline",
  "under_review",
  "review_rejected",
  "deleted",
] as const;
export type ContentPublicationState = (typeof CONTENT_PUBLICATION_STATES)[number];

export const CONTENT_VISIBILITIES = [
  "public",
  "login_required",
  "member_only",
  "purchased_only",
] as const;
export type ContentVisibility = (typeof CONTENT_VISIBILITIES)[number];

export const CONTENT_LIFECYCLE_ACTIONS = [
  "publish",
  "update",
  "archive",
  "delete",
  "restore",
  "submit_review",
  "approve_review",
  "reject_review",
  "change_visibility",
] as const;
export type ContentLifecycleAction = (typeof CONTENT_LIFECYCLE_ACTIONS)[number];

export const CONTENT_ACTOR_ROLES = ["author", "reviewer", "admin", "reader"] as const;
export type ContentActorRole = (typeof CONTENT_ACTOR_ROLES)[number];

export const CONTENT_REVIEW_STATUSES = ["not_requested", "queued", "approved", "rejected"] as const;
export type ContentReviewStatus = (typeof CONTENT_REVIEW_STATUSES)[number];

export const CONTENT_ATTACHMENT_KINDS = ["cover", "attachment", "gallery"] as const;
export type ContentAttachmentKind = (typeof CONTENT_ATTACHMENT_KINDS)[number];

export const CONTENT_RECOMMENDATION_SLOTS = [
  "frontlist",
  "editorial",
  "premium",
  "ranking",
  "related",
  "continue_reading",
] as const;
export type ContentRecommendationSlot = (typeof CONTENT_RECOMMENDATION_SLOTS)[number];

export interface ContentFacet {
  key: string;
  label: string;
}

export interface ContentDisplay {
  category: ContentFacet;
  tags: ContentFacet[];
  topics: ContentFacet[];
  recommendationSlot?: ContentRecommendationSlot;
  recommendationSlotLabel?: string;
  pinned: boolean;
  featured: boolean;
}

export interface ContentLifecycle {
  state: ContentPublicationState;
  availableActions: ContentLifecycleAction[];
  publishedAt?: string;
  updatedAt?: string;
  offlineAt?: string;
  reviewMessage?: string;
}

export interface ContentAccess {
  visibility: ContentVisibility;
  accessible: boolean;
  previewAvailable: boolean;
  requiresLogin: boolean;
  requiresMembership: boolean;
  requiresPurchase: boolean;
  purchased?: boolean;
  summaryLabel: string;
  gateLabel?: string;
  entitlementLabel?: string;
}

export interface ContentPermissions {
  actorRole: ContentActorRole;
  canEdit: boolean;
  canSaveDraft: boolean;
  canSubmitReview: boolean;
  canApproveReview: boolean;
  canRejectReview: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canRestore: boolean;
  canChangeVisibility: boolean;
  canManageAttachments: boolean;
  canViewAuditHistory: boolean;
}

export interface ContentAttachmentReference {
  assetId: string;
  kind: ContentAttachmentKind;
  label: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface ContentReviewRecord {
  reviewId: string;
  status: ContentReviewStatus;
  queueLabel?: string;
  reviewerLabel?: string;
  submittedAt?: string;
  assignedAt?: string;
  decidedAt?: string;
  message?: string;
}

export interface ContentAuditEntry {
  auditId: string;
  action: ContentLifecycleAction | "create" | "save_draft" | "assign_review";
  actorRole: ContentActorRole;
  actorLabel: string;
  createdAt: string;
  message: string;
}

export interface ContentAuthoringData {
  title: string;
  subtitle?: string;
  summary: string;
  bodyPreview?: string;
  visibility: ContentVisibility;
  category: ContentFacet;
  tags: ContentFacet[];
  coverAssetId?: string;
  attachmentAssetIds: string[];
}

export interface ContentCard {
  contentId: string;
  model: ContentModel;
  title: string;
  subtitle?: string;
  summary: string;
  coverUrl?: string;
  authorLabel?: string;
  display: ContentDisplay;
  lifecycle: ContentLifecycle;
  reviewRecord?: ContentReviewRecord;
}

export interface ContentDetail {
  contentId: string;
  model: ContentModel;
  title: string;
  subtitle?: string;
  summary: string;
  coverUrl?: string;
  authorLabel?: string;
  display: ContentDisplay;
  lifecycle: ContentLifecycle;
  recommendationReason?: string;
  bodyPreview?: string;
  authoring?: ContentAuthoringData;
  attachments?: ContentAttachmentReference[];
  reviewRecord?: ContentReviewRecord;
  permissions?: ContentPermissions;
  auditHistory?: ContentAuditEntry[];
}

export interface ContentDetailResponse {
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
}

export interface ContentReviewQueueItem {
  contentId: string;
  model: ContentModel;
  title: string;
  lifecycleState: ContentPublicationState;
  visibility: ContentVisibility;
  authorLabel: string;
  queueLabel: string;
  attachmentsCount: number;
  submittedAt?: string;
  reviewerLabel?: string;
  selected?: boolean;
}

export interface ContentReviewQueue {
  items: ContentReviewQueueItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  selectedContentId?: string;
}

export interface ContentReviewQueueResponse {
  reviewQueue: ContentReviewQueue;
}

export interface GetContentDetailRequest {
  contentId: string;
  actorRole?: ContentActorRole;
}

export interface SaveContentDraftRequest {
  contentId?: string;
  model: ContentModel;
  title: string;
  subtitle?: string;
  summary: string;
  bodyPreview?: string;
  visibility: ContentVisibility;
  categoryKey: string;
  categoryLabel: string;
  tags: ContentFacet[];
  coverAssetId?: string;
  attachmentAssetIds?: string[];
  actorRole?: ContentActorRole;
}

export interface SaveContentDraftResponse {
  contentCard: ContentCard;
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
  transitionMessage: string;
}

export interface ContentLifecycleMutationRequest {
  contentId: string;
  action: ContentLifecycleAction;
  visibility?: ContentVisibility;
  reviewMessage?: string;
  actorRole?: ContentActorRole;
}

export interface ContentLifecycleMutationResponse {
  contentCard: ContentCard;
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
  transitionMessage: string;
}

export interface ListContentReviewQueueRequest {
  page?: number;
  pageSize?: number;
  state?: ContentPublicationState | "all";
  actorRole?: ContentActorRole;
}
