import type {
  FeedbackCategory,
  FormApprovalNode,
  FormFieldDefinition,
  FormSchema,
} from "@minix/contracts";
import {
  createFormDraftState,
  createFormSchema,
  createFormWorkflowState,
} from "@minix/core";

import type { FeedbackState, FeedbackValues } from "../model";

export const feedbackDraftStorageKey = "@minix/feedback/form-draft/v1";

export function createFeedbackDraftState(input: {
  savedAt: number;
  restored?: boolean;
}): FeedbackState["workflow"]["draft"] {
  return createFormDraftState({
    draftId: "feedback-form",
    recoveryKey: feedbackDraftStorageKey,
    savedAt: input.savedAt,
    ...(input.restored ? { restored: true } : {}),
  });
}

function createFeedbackSchema(values: FeedbackValues, categories: FeedbackCategory[]): FormSchema {
  const typeOptions = Array.from(new Set(categories.map((category) => category.type))).map((type) => ({
    key: type,
    label: type.replaceAll("_", " "),
  }));
  const categoryOptions = categories.map((category) => ({
    key: category.key,
    label: category.label,
    ...(category.description ? { description: category.description } : {}),
  }));
  const fields: FormFieldDefinition[] = [
    {
      key: "type",
      label: "Feedback type",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "classify",
      options: typeOptions,
    },
    {
      key: "categoryKey",
      label: "Category",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "classify",
      options: categoryOptions,
    },
    {
      key: "title",
      label: "Title",
      type: "text",
      required: true,
      stepKey: "details",
      placeholder: "Short summary",
    },
    {
      key: "description",
      label: "Description",
      type: "rich_text",
      required: true,
      stepKey: "details",
      richTextToolbar: "placeholder",
    },
    {
      key: "satisfactionScore",
      label: "Satisfaction score",
      type: "number",
      dynamic: true,
      stepKey: "details",
      conditions: [{ field: "type", operator: "eq", value: "satisfaction" }],
    },
    {
      key: "revisitRequested",
      label: "Need follow-up",
      type: "single_select",
      dynamic: true,
      stepKey: "followup",
    },
    {
      key: "screenshotAssets",
      label: "Screenshots",
      type: "upload_reference",
      dynamic: true,
      stepKey: "attachments",
      uploadRole: "feedback-screenshot",
    },
    {
      key: "attachmentAssets",
      label: "Attachments",
      type: "upload_reference",
      dynamic: true,
      stepKey: "attachments",
      uploadRole: "feedback-attachment",
      conditions: [{ field: "categoryKey", operator: "neq", value: "satisfaction" }],
    },
  ];

  return createFormSchema({
    fields,
    steps: [
      { key: "classify", label: "Classify" },
      { key: "details", label: "Details" },
      { key: "attachments", label: "Attachments" },
      { key: "followup", label: "Follow-up" },
    ],
  });
}

function createFeedbackApprovalNodes(
  values: FeedbackValues,
  latestStatus: FeedbackState["latestStatus"],
): FormApprovalNode[] {
  if (!values.revisitRequested && !latestStatus) {
    return [];
  }

  const triageState =
    latestStatus?.state === "submitted" || latestStatus?.state === "triaged" || latestStatus?.state === "in_progress"
      ? "pending"
      : latestStatus
        ? "approved"
        : "pending";
  const resolutionState =
    latestStatus?.revisitRequired || latestStatus?.state === "waiting_user"
      ? "pending"
      : latestStatus?.state === "resolved" || latestStatus?.state === "closed"
        ? "approved"
        : "not_started";

  return [
    {
      nodeKey: "support-triage",
      label: "Support triage",
      state: triageState,
      assigneeLabel: "Support Desk",
      comment: latestStatus?.progressLabel ?? "Support reviews the submission and routes it into the handling queue.",
    },
    {
      nodeKey: "resolution-followup",
      label: "Resolution follow-up",
      state: resolutionState,
      assigneeLabel: "Case Owner",
      comment: latestStatus?.nextStepLabel ?? "Additional user replies are collected before the ticket closes.",
    },
  ];
}

export function createFeedbackWorkflow(
  values: FeedbackValues,
  state: Pick<FeedbackState, "categories" | "latestStatus">,
  currentStepKey?: string,
  draft?: FeedbackState["workflow"]["draft"],
) {
  const schema = createFeedbackSchema(values, state.categories);
  const approvalNodes = createFeedbackApprovalNodes(values, state.latestStatus);
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
      ...(currentStepKey ? { currentStepKey } : {}),
      ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
      ...(draft ? { draft } : {}),
    }),
  };
}
