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
}

export interface ContentDetailResponse {
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
}

export interface ContentLifecycleMutationRequest {
  contentId: string;
  action: ContentLifecycleAction;
  visibility?: ContentVisibility;
  reviewMessage?: string;
}

export interface ContentLifecycleMutationResponse {
  contentCard: ContentCard;
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
  transitionMessage: string;
}
