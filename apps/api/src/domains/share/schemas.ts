import { SHARE_CHANNEL_KINDS, SHARE_RETURN_OUTCOMES, SHARE_SCENARIOS, type SharePrepareRequest } from "@minix/contracts";
import { z } from "zod";

import {
  apiActorContextSchema,
  apiAuthRedirectTargetSchema,
  apiRouteParamsSchema,
  apiSourceContextSchema,
  normalizeApiAuthRedirectTarget,
  normalizeApiContextSnapshots,
  pickDefinedApiFields,
} from "../schema-helpers";

export const shareRedirectTargetSchema = apiAuthRedirectTargetSchema;

export const shareLandingTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  shortLink: z.string().min(1).optional(),
  shortCode: z.string().min(1).optional(),
  params: apiRouteParamsSchema.optional(),
  channelMarker: z.string().min(1).optional(),
  authRedirect: shareRedirectTargetSchema.optional(),
});

export const sharePayloadSchema = z.object({
  scenario: z.enum(SHARE_SCENARIOS),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  coverUrl: z.string().min(1).optional(),
  landingPath: z.string().min(1).optional(),
  landingUrl: z.string().min(1).optional(),
  shortLink: z.string().min(1).optional(),
  posterImageUrl: z.string().min(1).optional(),
  trackingParams: z.record(z.string(), z.string()),
  channelMarker: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  inviteCode: z.string().min(1).optional(),
  shareToken: z.string().min(1).optional(),
  sourceContext: apiSourceContextSchema.optional(),
  landingTarget: shareLandingTargetSchema.optional(),
  returnTarget: shareRedirectTargetSchema.optional(),
});

export const shareChannelSchema = z.object({
  kind: z.enum(SHARE_CHANNEL_KINDS),
  label: z.string().min(1),
  executable: z.boolean(),
  channelMarker: z.string().min(1).optional(),
});

export const shareAttributionSchema = z.object({
  attributionId: z.string().min(1).optional(),
  channelMarker: z.string().min(1).optional(),
  actorContext: apiActorContextSchema.optional(),
  inviteBindingEnabled: z.boolean(),
  returnFlowRecognized: z.boolean(),
  shareCount: z.number().int().nonnegative(),
  clickCount: z.number().int().nonnegative(),
  returnCount: z.number().int().nonnegative(),
  conversionCount: z.number().int().nonnegative(),
  preparedAt: z.string().min(1).optional(),
  lastSharedAt: z.string().min(1).optional(),
  lastClickAt: z.string().min(1).optional(),
  lastConversionAt: z.string().min(1).optional(),
  lastReturnAt: z.string().min(1).optional(),
  lastLandingPath: z.string().min(1).optional(),
  inviteBoundUserId: z.string().min(1).optional(),
  returnTarget: shareRedirectTargetSchema.optional(),
});

export const sharePrepareSchema = z.object({
  sharePayload: sharePayloadSchema,
  shareChannel: shareChannelSchema,
  shareAttribution: shareAttributionSchema,
  redirectTarget: shareRedirectTargetSchema.optional(),
});

export const shareReturnRecognitionSchema = z.object({
  attributionId: z.string().min(1),
  outcome: z.enum(SHARE_RETURN_OUTCOMES),
  recognizedPath: z.string().min(1).optional(),
  recognizedUserId: z.string().min(1).optional(),
});

export const shareResolveSchema = z.object({
  attributionId: z.string().min(1).optional(),
  shortCode: z.string().min(1).optional(),
});

export const shareAttributionReportSchema = z.object({
  attributionId: z.string().min(1),
});

export function normalizeSharePrepareRequest(payload: z.infer<typeof sharePrepareSchema>): SharePrepareRequest {
  const landingAuthRedirect = normalizeApiAuthRedirectTarget(payload.sharePayload.landingTarget?.authRedirect);
  const landingTarget = payload.sharePayload.landingTarget
    ? {
        ...pickDefinedApiFields(payload.sharePayload.landingTarget, [
          "routeId",
          "path",
          "url",
          "shortLink",
          "shortCode",
          "params",
          "channelMarker",
        ]),
        ...pickDefinedApiFields({ authRedirect: landingAuthRedirect }, ["authRedirect"]),
      }
    : undefined;
  const { sourceContext, actorContext } = normalizeApiContextSnapshots({
    sourceContext: payload.sharePayload.sourceContext,
    actorContext: payload.shareAttribution.actorContext,
  });
  const returnTarget = normalizeApiAuthRedirectTarget(payload.sharePayload.returnTarget);
  const attributionReturnTarget = normalizeApiAuthRedirectTarget(payload.shareAttribution.returnTarget);
  const redirectTarget = normalizeApiAuthRedirectTarget(payload.redirectTarget);

  return {
    sharePayload: {
      scenario: payload.sharePayload.scenario,
      title: payload.sharePayload.title,
      ...pickDefinedApiFields(payload.sharePayload, [
        "summary",
        "coverUrl",
        "landingPath",
        "landingUrl",
        "shortLink",
        "posterImageUrl",
      ]),
      trackingParams: payload.sharePayload.trackingParams,
      ...pickDefinedApiFields(payload.sharePayload, ["channelMarker", "contentId", "inviteCode", "shareToken"]),
      ...pickDefinedApiFields({ sourceContext, landingTarget, returnTarget }, [
        "sourceContext",
        "landingTarget",
        "returnTarget",
      ]),
    },
    shareChannel: {
      kind: payload.shareChannel.kind,
      label: payload.shareChannel.label,
      executable: payload.shareChannel.executable,
      ...pickDefinedApiFields(payload.shareChannel, ["channelMarker"]),
    },
    shareAttribution: {
      ...pickDefinedApiFields(payload.shareAttribution, ["attributionId", "channelMarker"]),
      ...pickDefinedApiFields({ actorContext }, ["actorContext"]),
      inviteBindingEnabled: payload.shareAttribution.inviteBindingEnabled,
      returnFlowRecognized: payload.shareAttribution.returnFlowRecognized,
      shareCount: payload.shareAttribution.shareCount,
      clickCount: payload.shareAttribution.clickCount,
      returnCount: payload.shareAttribution.returnCount,
      conversionCount: payload.shareAttribution.conversionCount,
      ...pickDefinedApiFields(payload.shareAttribution, [
        "preparedAt",
        "lastSharedAt",
        "lastClickAt",
        "lastConversionAt",
        "lastReturnAt",
        "lastLandingPath",
        "inviteBoundUserId",
      ]),
      ...pickDefinedApiFields({ returnTarget: attributionReturnTarget }, ["returnTarget"]),
    },
    ...pickDefinedApiFields({ redirectTarget }, ["redirectTarget"]),
  };
}
