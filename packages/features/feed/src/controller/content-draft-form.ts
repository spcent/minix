import {
  createFormDraftState,
  createFormSchema,
  createFormWorkflowState,
} from "@minix/core";
import type {
  FormApprovalNode,
  FormFieldDefinition,
  FormSchema,
  SaveContentDraftResponse,
  ContentReviewQueueItem,
} from "@minix/contracts";

import type { ContentDraftFormValues } from "../model";

export const CONTENT_DRAFT_STORAGE_KEY = "@minix/feed/content-draft/v1";

function createContentDraftSchema(values: ContentDraftFormValues): FormSchema {
  const fields: FormFieldDefinition[] = [
    {
      key: "model",
      label: "Content model",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "basics",
      options: [
        { key: "article", label: "Article" },
        { key: "course", label: "Course" },
        { key: "event", label: "Event" },
        { key: "post", label: "Post" },
      ],
    },
    {
      key: "title",
      label: "Title",
      type: "text",
      required: true,
      stepKey: "basics",
    },
    {
      key: "subtitle",
      label: "Subtitle",
      type: "text",
      stepKey: "basics",
    },
    {
      key: "summary",
      label: "Summary",
      type: "text",
      required: true,
      stepKey: "basics",
    },
    {
      key: "bodyPreview",
      label: "Body preview",
      type: "rich_text",
      required: true,
      stepKey: "editorial",
      richTextToolbar: "placeholder",
    },
    {
      key: "tagKeys",
      label: "Tags",
      type: "multi_select",
      dynamic: true,
      stepKey: "editorial",
      options: [
        { key: "news", label: "News" },
        { key: "featured", label: "Featured" },
        { key: "member", label: "Member" },
        { key: "event", label: "Event" },
      ],
    },
    {
      key: "visibility",
      label: "Visibility",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "distribution",
      options: [
        { key: "public", label: "Public" },
        { key: "login_required", label: "Login required" },
        { key: "member_only", label: "Member only" },
        { key: "purchased_only", label: "Purchased only" },
      ],
    },
    {
      key: "publishAt",
      label: "Publish date",
      type: "date",
      dynamic: true,
      stepKey: "distribution",
      conditions: [{ field: "model", operator: "eq", value: "event" }],
    },
    {
      key: "coverAssetId",
      label: "Cover asset",
      type: "upload_reference",
      dynamic: true,
      stepKey: "assets",
      uploadRole: "content-cover",
    },
    {
      key: "attachmentAssetIds",
      label: "Attachment assets",
      type: "upload_reference",
      dynamic: true,
      stepKey: "assets",
      uploadRole: "content-attachment",
      conditions: [{ field: "model", operator: "neq", value: "post" }],
    },
  ];

  return createFormSchema({
    fields,
    steps: [
      { key: "basics", label: "Basics" },
      { key: "editorial", label: "Editorial" },
      { key: "distribution", label: "Distribution" },
      { key: "assets", label: "Assets" },
      { key: "review", label: "Review" },
    ],
  });
}

function createContentDraftApprovalNodes(
  response?: SaveContentDraftResponse,
  selectedReviewItem?: ContentReviewQueueItem,
): FormApprovalNode[] {
  const reviewStatus = response?.contentDetail.reviewRecord?.status;
  if (!reviewStatus && !selectedReviewItem) {
    return [];
  }

  return [
    {
      nodeKey: "authoring",
      label: "Authoring",
      state: "approved",
      assigneeLabel: response?.contentDetail.authorLabel ?? "Author",
      comment: response?.transitionMessage ?? "Draft content is ready for editorial review.",
    },
    {
      nodeKey: "review",
      label: "Editorial review",
      state:
        reviewStatus === "approved"
          ? "approved"
          : reviewStatus === "rejected"
            ? "rejected"
            : reviewStatus === "queued" || selectedReviewItem?.lifecycleState === "under_review"
              ? "pending"
              : "not_started",
      assigneeLabel: selectedReviewItem?.reviewerLabel ?? response?.contentDetail.reviewRecord?.reviewerLabel ?? "Reviewer",
      comment:
        response?.contentDetail.reviewRecord?.message ??
        selectedReviewItem?.queueLabel ??
        "Editorial review will start after the draft is submitted.",
    },
  ];
}

export function buildContentDraftFormState(
  values: ContentDraftFormValues,
  options: {
    currentStepKey?: string;
    draftSavedAt?: number;
    restored?: boolean;
    lastResponse?: SaveContentDraftResponse;
    selectedReviewItem?: ContentReviewQueueItem;
  } = {},
) {
  const schema = createContentDraftSchema(values);
  const approvalNodes = createContentDraftApprovalNodes(options.lastResponse, options.selectedReviewItem);
  const approvalState = approvalNodes.some((node) => node.state === "pending")
    ? "pending"
    : approvalNodes.some((node) => node.state === "approved")
      ? "approved"
      : "none";

  return {
    schema,
    workflow: createFormWorkflowState({
      values,
      schema,
      approvalState,
      ...(options.currentStepKey ? { currentStepKey: options.currentStepKey } : {}),
      ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
      ...(options.draftSavedAt !== undefined
        ? {
            draft: createFormDraftState({
              draftId: "content-draft",
              recoveryKey: CONTENT_DRAFT_STORAGE_KEY,
              savedAt: options.draftSavedAt,
              ...(options.restored ? { restored: true } : {}),
            }),
          }
        : {}),
    }),
  };
}
