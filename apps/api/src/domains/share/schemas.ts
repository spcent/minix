import type { SharePrepareRequest } from "@minix/contracts";
import { z } from "zod";

export const shareRedirectTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  source: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  reason: z.enum(["auth-required", "session-expired", "force-relogin"]).optional(),
  forceReauth: z.boolean().optional(),
});

export const shareLandingTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  shortLink: z.string().min(1).optional(),
  shortCode: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  channelMarker: z.string().min(1).optional(),
  authRedirect: shareRedirectTargetSchema.optional(),
});

export const sharePayloadSchema = z.object({
  scenario: z.enum(["page", "content", "invite", "poster"]),
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
  sourceContext: z
    .object({
      pagePath: z.string().min(1).optional(),
      routeId: z.string().min(1).optional(),
      label: z.string().min(1).optional(),
      params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    })
    .optional(),
  landingTarget: shareLandingTargetSchema.optional(),
  returnTarget: shareRedirectTargetSchema.optional(),
});

export const shareChannelSchema = z.object({
  kind: z.enum(["wechat_session", "wechat_moments", "copy_link", "poster_image", "short_link"]),
  label: z.string().min(1),
  executable: z.boolean(),
  channelMarker: z.string().min(1).optional(),
});

export const shareAttributionSchema = z.object({
  attributionId: z.string().min(1).optional(),
  channelMarker: z.string().min(1).optional(),
  actorContext: z
    .object({
      userId: z.string().min(1).optional(),
      platform: z.string().min(1).optional(),
      appVersion: z.string().min(1).optional(),
      deviceSummary: z.string().min(1).optional(),
    })
    .optional(),
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
  outcome: z.enum(["click", "return", "conversion"]),
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
  const normalizeRedirectTarget = (value: z.infer<typeof shareRedirectTargetSchema> | undefined) =>
    value
      ? {
          ...(value.routeId !== undefined ? { routeId: value.routeId } : {}),
          ...(value.path !== undefined ? { path: value.path } : {}),
          ...(value.params !== undefined ? { params: value.params } : {}),
          ...(value.source !== undefined ? { source: value.source } : {}),
          ...(value.label !== undefined ? { label: value.label } : {}),
          ...(value.reason !== undefined ? { reason: value.reason } : {}),
          ...(value.forceReauth !== undefined ? { forceReauth: value.forceReauth } : {}),
        }
      : undefined;
  const landingAuthRedirect = normalizeRedirectTarget(payload.sharePayload.landingTarget?.authRedirect);
  const landingTarget = payload.sharePayload.landingTarget
    ? {
        ...(payload.sharePayload.landingTarget.routeId !== undefined
          ? { routeId: payload.sharePayload.landingTarget.routeId }
          : {}),
        ...(payload.sharePayload.landingTarget.path !== undefined ? { path: payload.sharePayload.landingTarget.path } : {}),
        ...(payload.sharePayload.landingTarget.url !== undefined ? { url: payload.sharePayload.landingTarget.url } : {}),
        ...(payload.sharePayload.landingTarget.shortLink !== undefined
          ? { shortLink: payload.sharePayload.landingTarget.shortLink }
          : {}),
        ...(payload.sharePayload.landingTarget.shortCode !== undefined
          ? { shortCode: payload.sharePayload.landingTarget.shortCode }
          : {}),
        ...(payload.sharePayload.landingTarget.params !== undefined ? { params: payload.sharePayload.landingTarget.params } : {}),
        ...(payload.sharePayload.landingTarget.channelMarker !== undefined
          ? { channelMarker: payload.sharePayload.landingTarget.channelMarker }
          : {}),
        ...(landingAuthRedirect !== undefined ? { authRedirect: landingAuthRedirect } : {}),
      }
    : undefined;
  const returnTarget = normalizeRedirectTarget(payload.sharePayload.returnTarget);
  const attributionReturnTarget = normalizeRedirectTarget(payload.shareAttribution.returnTarget);
  const redirectTarget = normalizeRedirectTarget(payload.redirectTarget);

  return {
    sharePayload: {
      scenario: payload.sharePayload.scenario,
      title: payload.sharePayload.title,
      ...(payload.sharePayload.summary !== undefined ? { summary: payload.sharePayload.summary } : {}),
      ...(payload.sharePayload.coverUrl !== undefined ? { coverUrl: payload.sharePayload.coverUrl } : {}),
      ...(payload.sharePayload.landingPath !== undefined ? { landingPath: payload.sharePayload.landingPath } : {}),
      ...(payload.sharePayload.landingUrl !== undefined ? { landingUrl: payload.sharePayload.landingUrl } : {}),
      ...(payload.sharePayload.shortLink !== undefined ? { shortLink: payload.sharePayload.shortLink } : {}),
      ...(payload.sharePayload.posterImageUrl !== undefined
        ? { posterImageUrl: payload.sharePayload.posterImageUrl }
        : {}),
      trackingParams: payload.sharePayload.trackingParams,
      ...(payload.sharePayload.channelMarker !== undefined ? { channelMarker: payload.sharePayload.channelMarker } : {}),
      ...(payload.sharePayload.contentId !== undefined ? { contentId: payload.sharePayload.contentId } : {}),
      ...(payload.sharePayload.inviteCode !== undefined ? { inviteCode: payload.sharePayload.inviteCode } : {}),
      ...(payload.sharePayload.shareToken !== undefined ? { shareToken: payload.sharePayload.shareToken } : {}),
      ...(payload.sharePayload.sourceContext !== undefined
        ? {
            sourceContext: {
              ...(payload.sharePayload.sourceContext.pagePath !== undefined ? { pagePath: payload.sharePayload.sourceContext.pagePath } : {}),
              ...(payload.sharePayload.sourceContext.routeId !== undefined ? { routeId: payload.sharePayload.sourceContext.routeId } : {}),
              ...(payload.sharePayload.sourceContext.label !== undefined ? { label: payload.sharePayload.sourceContext.label } : {}),
              ...(payload.sharePayload.sourceContext.params !== undefined ? { params: payload.sharePayload.sourceContext.params } : {}),
            },
          }
        : {}),
      ...(landingTarget !== undefined ? { landingTarget } : {}),
      ...(returnTarget !== undefined ? { returnTarget } : {}),
    },
    shareChannel: {
      kind: payload.shareChannel.kind,
      label: payload.shareChannel.label,
      executable: payload.shareChannel.executable,
      ...(payload.shareChannel.channelMarker !== undefined ? { channelMarker: payload.shareChannel.channelMarker } : {}),
    },
    shareAttribution: {
      ...(payload.shareAttribution.attributionId !== undefined ? { attributionId: payload.shareAttribution.attributionId } : {}),
      ...(payload.shareAttribution.channelMarker !== undefined ? { channelMarker: payload.shareAttribution.channelMarker } : {}),
      ...(payload.shareAttribution.actorContext !== undefined
        ? {
            actorContext: {
              ...(payload.shareAttribution.actorContext.userId !== undefined ? { userId: payload.shareAttribution.actorContext.userId } : {}),
              ...(payload.shareAttribution.actorContext.platform !== undefined ? { platform: payload.shareAttribution.actorContext.platform } : {}),
              ...(payload.shareAttribution.actorContext.appVersion !== undefined ? { appVersion: payload.shareAttribution.actorContext.appVersion } : {}),
              ...(payload.shareAttribution.actorContext.deviceSummary !== undefined
                ? { deviceSummary: payload.shareAttribution.actorContext.deviceSummary }
                : {}),
            },
          }
        : {}),
      inviteBindingEnabled: payload.shareAttribution.inviteBindingEnabled,
      returnFlowRecognized: payload.shareAttribution.returnFlowRecognized,
      shareCount: payload.shareAttribution.shareCount,
      clickCount: payload.shareAttribution.clickCount,
      returnCount: payload.shareAttribution.returnCount,
      conversionCount: payload.shareAttribution.conversionCount,
      ...(payload.shareAttribution.preparedAt !== undefined ? { preparedAt: payload.shareAttribution.preparedAt } : {}),
      ...(payload.shareAttribution.lastSharedAt !== undefined ? { lastSharedAt: payload.shareAttribution.lastSharedAt } : {}),
      ...(payload.shareAttribution.lastClickAt !== undefined ? { lastClickAt: payload.shareAttribution.lastClickAt } : {}),
      ...(payload.shareAttribution.lastConversionAt !== undefined
        ? { lastConversionAt: payload.shareAttribution.lastConversionAt }
        : {}),
      ...(payload.shareAttribution.lastReturnAt !== undefined ? { lastReturnAt: payload.shareAttribution.lastReturnAt } : {}),
      ...(payload.shareAttribution.lastLandingPath !== undefined
        ? { lastLandingPath: payload.shareAttribution.lastLandingPath }
        : {}),
      ...(payload.shareAttribution.inviteBoundUserId !== undefined
        ? { inviteBoundUserId: payload.shareAttribution.inviteBoundUserId }
        : {}),
      ...(attributionReturnTarget !== undefined ? { returnTarget: attributionReturnTarget } : {}),
    },
    ...(redirectTarget !== undefined ? { redirectTarget } : {}),
  };
}
