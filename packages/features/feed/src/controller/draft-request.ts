import type { SaveContentDraftRequest } from "@minix/contracts";

import type { ContentDraftFormValues } from "../model";

export function createContentDraftRequest(values: ContentDraftFormValues): SaveContentDraftRequest {
  return {
    ...(values.contentId ? { contentId: values.contentId } : {}),
    model: values.model,
    title: values.title,
    ...(values.subtitle ? { subtitle: values.subtitle } : {}),
    summary: values.summary,
    bodyPreview: values.bodyPreview,
    visibility: values.visibility,
    categoryKey: values.categoryKey,
    categoryLabel: values.categoryLabel,
    tags: values.tagKeys.map((key) => ({
      key,
      label: key.slice(0, 1).toUpperCase() + key.slice(1),
    })),
    ...(values.coverAssetId ? { coverAssetId: values.coverAssetId } : {}),
    ...(values.attachmentAssetIds.length > 0 ? { attachmentAssetIds: values.attachmentAssetIds } : {}),
    actorRole: values.actorRole,
  };
}
