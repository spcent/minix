import {
  createUploadClientFlow,
  ok,
  type AppKernel,
  type Store,
} from "@minix/core";
import type { UploadPipelineResponse } from "@minix/contracts";

import type { FeedbackState, FeedbackValues } from "../model";

export type FeedbackUploadKind = "screenshot" | "attachment";

export interface FeedbackUploadWorkflowPaths {
  uploadRequestPath: string;
  uploadSessionPath: string;
  uploadChunkPath: string;
  uploadCompletePath: string;
}

export async function addFeedbackUploadedAsset(input: {
  kernel: AppKernel;
  store: Store<FeedbackState>;
  kind: FeedbackUploadKind;
  paths: FeedbackUploadWorkflowPaths;
  applyFeedbackValues: (
    values: FeedbackValues,
    options?: {
      dirty?: boolean;
      currentStepKey?: string;
      draft?: FeedbackState["workflow"]["draft"];
      phase?: FeedbackState["submitState"]["phase"];
    },
  ) => void;
}) {
  const uploadStatus = input.kernel.capability?.status("upload");
  if (!input.kernel.capability || !uploadStatus?.ok || !uploadStatus.value.available) {
    input.store.setState({
      errorCode: "CAPABILITY_UNAVAILABLE",
      errorText: uploadStatus?.ok ? uploadStatus.value.detail ?? "Upload capability is unavailable on this host." : "Upload capability is unavailable on this host.",
    });
    return ok(undefined);
  }

  input.store.setState({
    loading: true,
    errorCode: undefined,
    errorText: undefined,
  });

  const uploadFlow = createUploadClientFlow({
    kernel: input.kernel,
    ...input.paths,
  });
  const result = await uploadFlow.selectAndUpload({
    scenario: input.kind === "screenshot" ? "content" : "attachment",
    selection: {
      scenario: input.kind === "screenshot" ? "content" : "attachment",
      preferredFileType: input.kind === "screenshot" ? "image" : "attachment",
      acceptedFileTypes: input.kind === "screenshot" ? ["image"] : ["attachment", "pdf", "image"],
      maxSelectCount: 1,
      governance: {
        maxSizeBytes: input.kind === "screenshot" ? 10_000_000 : 15_000_000,
        acceptedFileTypes: input.kind === "screenshot" ? ["image"] : ["attachment", "pdf", "image"],
        sensitiveReviewRequired: true,
        expiresInDays: 30,
      },
    },
  });

  if (!result.ok) {
    input.store.setState({
      loading: false,
      errorCode: result.error.code,
      errorText: result.error.message,
    });
    return result;
  }

  return applyFeedbackUploadResponse({
    ...input,
    response: result.value,
  });
}

function applyFeedbackUploadResponse(input: {
  store: Store<FeedbackState>;
  kind: FeedbackUploadKind;
  response: UploadPipelineResponse;
  applyFeedbackValues: (
    values: FeedbackValues,
    options?: {
      dirty?: boolean;
      currentStepKey?: string;
      draft?: FeedbackState["workflow"]["draft"];
      phase?: FeedbackState["submitState"]["phase"];
    },
  ) => void;
}) {
  const uploadedAsset = input.response.uploadAsset;
  if (!uploadedAsset) {
    input.store.setState({
      loading: false,
      errorCode: input.response.uploadError?.code,
      errorText: input.response.uploadError?.message ?? "The upload pipeline did not return a finalized asset.",
    });
    return ok(undefined);
  }

  const current = input.store.getState();
  input.applyFeedbackValues(
    {
      ...current.values,
      ...(input.kind === "screenshot"
        ? { screenshotAssets: [...current.values.screenshotAssets, uploadedAsset] }
        : { attachmentAssets: [...current.values.attachmentAssets, uploadedAsset] }),
    },
    {
      dirty: true,
      ...(current.workflow.currentStepKey ? { currentStepKey: current.workflow.currentStepKey } : {}),
      ...(current.workflow.draft ? { draft: current.workflow.draft } : {}),
    },
  );
  input.store.setState({
    loading: false,
    errorCode: undefined,
    errorText: undefined,
  });

  return ok(input.response);
}
