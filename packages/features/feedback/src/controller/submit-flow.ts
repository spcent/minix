import type {
  FeedbackTicketDetailResponse,
  SubmitFeedbackRequest,
} from "@minix/contracts";
import type { Result, Store } from "@minix/core";

import type { FeedbackState, FeedbackValues } from "../model";

export type FailedFeedbackSubmitResult = Extract<Result<FeedbackTicketDetailResponse>, { ok: false }>;

export function createSubmitFeedbackPayload(values: FeedbackValues): SubmitFeedbackRequest {
  return {
    type: values.type,
    categoryKey: values.categoryKey,
    title: values.title,
    description: values.description,
    revisitRequested: values.revisitRequested,
    ...(values.satisfactionScore !== undefined ? { satisfactionScore: values.satisfactionScore } : {}),
    context: {
      sourcePage: values.sourcePage,
      ...(values.sourceRouteId ? { sourceRouteId: values.sourceRouteId } : {}),
      ...(values.sourceLabel ? { sourceLabel: values.sourceLabel } : {}),
      ...(values.userId ? { userId: values.userId } : {}),
      platform: values.platform,
      appVersion: values.appVersion,
      ...(values.deviceSummary ? { deviceSummary: values.deviceSummary } : {}),
      sourceContext: {
        pagePath: values.sourcePage,
        ...(values.sourceRouteId ? { routeId: values.sourceRouteId } : {}),
        ...(values.sourceLabel ? { label: values.sourceLabel } : {}),
      },
      actorContext: {
        ...(values.userId ? { userId: values.userId } : {}),
        platform: values.platform,
        appVersion: values.appVersion,
        ...(values.deviceSummary ? { deviceSummary: values.deviceSummary } : {}),
      },
      screenshotAssets: values.screenshotAssets,
      attachmentAssets: values.attachmentAssets,
    },
  };
}

export async function applyFeedbackFailure(input: {
  store: Store<FeedbackState>;
  result: FailedFeedbackSubmitResult;
  routeToLogin: () => Promise<Result<void>>;
}) {
  input.store.setState({
    loading: false,
    submitting: false,
    ready: true,
    errorCode: input.result.error.code,
    errorText: input.result.error.message,
    submitState: {
      ...input.store.getState().submitState,
      phase: "failed",
    },
  });

  if (input.result.error.code === "UNAUTHORIZED") {
    await input.routeToLogin();
  }

  return input.result;
}
