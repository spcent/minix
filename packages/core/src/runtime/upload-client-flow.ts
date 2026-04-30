import type {
  UploadChunkRequest,
  UploadCompleteRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadSelectionRequest,
  UploadSelectionResult,
} from "@minix/contracts";

import { createError, fail, type Result } from "../error/index";
import type { AppKernel } from "./app";

export interface CreateUploadClientFlowOptions {
  kernel: AppKernel;
  uploadRequestPath: string;
  uploadSessionPath: string;
  uploadChunkPath: string;
  uploadCompletePath: string;
  onProgress?: (response: UploadPipelineResponse) => void;
  onSelectionDetail?: (detail?: string) => void;
}

export interface SelectAndUploadOptions {
  selection: UploadSelectionRequest;
  scenario: UploadPipelineRequest["scenario"];
}

export function createUploadClientFlow(options: CreateUploadClientFlowOptions) {
  async function continueUpload(response: UploadPipelineResponse): Promise<Result<UploadPipelineResponse>> {
    options.onProgress?.(response);
    if (!response.session || !response.transfer) {
      return { ok: true, value: response };
    }

    const activeSession = response.session;
    const activeTransfer = response.transfer;
    const nextChunkIndex = activeSession.nextChunkIndex ?? response.uploadTask.uploadedChunkCount ?? 0;
    let current = response;
    for (const chunk of activeTransfer.chunks.slice(nextChunkIndex)) {
      const chunkResult = await options.kernel.request.post<UploadPipelineResponse>(
        options.uploadChunkPath,
        {
          taskId: current.uploadTask.taskId,
          sessionId: current.session?.sessionId ?? activeSession.sessionId,
          chunk,
        } satisfies UploadChunkRequest,
      );
      if (!chunkResult.ok) {
        return chunkResult;
      }
      current = chunkResult.value;
      options.onProgress?.(current);
    }

    const completion = await options.kernel.request.post<UploadPipelineResponse>(
      options.uploadCompletePath,
      {
        taskId: current.uploadTask.taskId,
        sessionId: current.session?.sessionId ?? activeSession.sessionId,
        fileChecksum: activeTransfer.fileChecksum,
        checksumAlgorithm: activeTransfer.checksumAlgorithm,
      } satisfies UploadCompleteRequest,
    );
    if (!completion.ok) {
      return completion;
    }

    options.onProgress?.(completion.value);
    return completion;
  }

  async function selectAndUpload(input: SelectAndUploadOptions): Promise<Result<UploadPipelineResponse>> {
    if (!options.kernel.capability) {
      return fail(createError("CAPABILITY_UNAVAILABLE", "Upload capability is unavailable on this host.", { recoverable: true }));
    }

    const selection = await options.kernel.capability.execute<UploadSelectionResult>({
      capability: "upload",
      action: "selectAsset",
      payload: input.selection,
    });
    if (!selection.ok) {
      return selection;
    }

    options.onSelectionDetail?.(selection.value.detail);
    const value = selection.value.value;
    if (!value) {
      return fail(createError("INVALID_ARGUMENT", "The upload capability did not return a selected asset.", { recoverable: true }));
    }

    const request: UploadPipelineRequest = {
      scenario: input.scenario,
      selection: value,
    };
    const sessionResponse = await options.kernel.request.post<UploadPipelineResponse>(options.uploadSessionPath, request);
    if (!sessionResponse.ok) {
      if (options.uploadRequestPath === options.uploadSessionPath) {
        return sessionResponse;
      }

      return options.kernel.request.post<UploadPipelineResponse>(options.uploadRequestPath, request);
    }

    return continueUpload(sessionResponse.value);
  }

  return {
    continueUpload,
    selectAndUpload,
  };
}
