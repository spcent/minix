import type {
  ShareAttributionReport,
  ShareCampaignAttributionRule,
  ShareConversionEvidence,
  ShareAttributionReportResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareProviderPosture,
  ProviderPostureMode,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  ShareShortLinkResolveResponse,
} from "@minix/contracts";

import {
  isProductionProviderMode,
  normalizeProviderBaseUrl,
  resolveProviderName,
  resolveProviderPostureMode,
  resolveUrlHost,
  SECRET_MATERIAL_NOT_TRACKED_SUMMARY,
} from "../provider-posture";
import { cloneDomainSnapshot } from "../snapshot";

export interface ShareProviderRuntimeEnv {
  MINIX_SHARE_PROVIDER_MODE?: string;
  MINIX_SHARE_SHORT_LINK_PROVIDER?: string;
  MINIX_SHARE_POSTER_PROVIDER?: string;
  MINIX_SHARE_SHORT_LINK_BASE_URL?: string;
  MINIX_SHARE_POSTER_BASE_URL?: string;
}

function resolveShareProviderMode(runtimeEnv?: ShareProviderRuntimeEnv): ProviderPostureMode {
  return resolveProviderPostureMode(runtimeEnv?.MINIX_SHARE_PROVIDER_MODE);
}

function resolveShareShortLinkProvider(runtimeEnv?: ShareProviderRuntimeEnv): string {
  const providerMode = resolveShareProviderMode(runtimeEnv);
  return resolveProviderName({
    configuredName: runtimeEnv?.MINIX_SHARE_SHORT_LINK_PROVIDER,
    providerMode,
    productionFallback: "configured-short-link-provider",
    sampleFallback: "sample-short-link",
  });
}

function resolveSharePosterProvider(runtimeEnv?: ShareProviderRuntimeEnv): string {
  const providerMode = resolveShareProviderMode(runtimeEnv);
  return resolveProviderName({
    configuredName: runtimeEnv?.MINIX_SHARE_POSTER_PROVIDER,
    providerMode,
    productionFallback: "configured-poster-provider",
    sampleFallback: "sample-poster-provider",
  });
}

const buildShareShortLinkUrl = (
  shortCode: string,
  requestUrl: string,
  runtimeEnv?: ShareProviderRuntimeEnv,
): string => {
  const configuredBaseUrl = runtimeEnv?.MINIX_SHARE_SHORT_LINK_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return new URL(shortCode, normalizeProviderBaseUrl(configuredBaseUrl)).toString();
  }

  return new URL(`/share/resolve?shortCode=${shortCode}`, requestUrl).toString();
};

function resolveSharePosterAssetUrl(
  shortCode: string,
  requestUrl: string,
  runtimeEnv?: ShareProviderRuntimeEnv,
): string {
  const configuredBaseUrl = runtimeEnv?.MINIX_SHARE_POSTER_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return new URL(`${shortCode}.svg`, normalizeProviderBaseUrl(configuredBaseUrl)).toString();
  }

  return new URL(`/share-posters/${shortCode}.svg`, requestUrl).toString();
}

function createSharePayloadReadinessSummary(input: {
  scenario: SharePrepareRequest["sharePayload"]["scenario"];
  channelKind: SharePrepareRequest["shareChannel"]["kind"];
  hasShortLink: boolean;
  hasPoster: boolean;
}): string {
  const scenarioLabel = input.scenario === "invite" ? "Invite" : input.scenario === "poster" ? "Poster" : "Share";
  const shortLinkClause = input.hasShortLink ? "Short-link handoff is prepared." : "Short-link handoff is not required.";
  const posterClause = input.hasPoster ? "Poster delivery is prepared." : "Poster delivery is not required.";
  return `${scenarioLabel} payload is prepared for ${input.channelKind}. ${shortLinkClause} ${posterClause}`;
}

function createShareChannelReadinessSummary(input: {
  channelKind: SharePrepareRequest["shareChannel"]["kind"];
  providerMode: ProviderPostureMode;
  hasShortLink: boolean;
  hasPoster: boolean;
}): string {
  const providerClause =
    isProductionProviderMode(input.providerMode)
      ? "Provider-backed share infrastructure is configured."
      : "Share infrastructure remains sample-backed.";
  const shortLinkClause = input.hasShortLink ? "Short-link delivery is available." : "Short-link delivery is not required.";
  const posterClause = input.hasPoster ? "Poster delivery is available." : "Poster delivery is not required.";
  return `${input.channelKind} is normalized in shared state. ${providerClause} ${shortLinkClause} ${posterClause}`;
}

function createShareFallbackSummary(channelKind: SharePrepareRequest["shareChannel"]["kind"]): string {
  if (channelKind === "wechat_session" || channelKind === "wechat_moments") {
    return "Fallback remains host-managed if the native share bridge is unavailable.";
  }
  if (channelKind === "copy_link" || channelKind === "short_link") {
    return "Clipboard copy remains the normalized fallback for link-style share flows.";
  }
  if (channelKind === "poster_image") {
    return "Poster image generation stays normalized while dispatch can fall back to copy or save actions in the host.";
  }
  return "Fallback remains normalized through the shared share envelope.";
}

function createShareRecognitionSummary(shareCount: number, clickCount: number, returnCount: number, conversionCount: number): string {
  return `Share counts are ${shareCount} sent, ${clickCount} clicked, ${returnCount} returned, and ${conversionCount} converted.`;
}

function createShareReplaySummary(resolvedCount: number): string {
  return resolvedCount > 0
    ? `Short-link replay has been resolved ${resolvedCount} time${resolvedCount === 1 ? "" : "s"}.`
    : "Short-link replay has not been resolved yet.";
}

function createInviteBindingSummary(inviteBindingEnabled: boolean, inviteBoundUserId?: string): string {
  if (!inviteBindingEnabled) {
    return "Invite binding is disabled for this share flow.";
  }
  if (inviteBoundUserId) {
    return `Invite binding is active and last recognized user ${inviteBoundUserId} is attached to the attribution record.`;
  }
  return "Invite binding is active and waiting for a recognized conversion user.";
}

function createShareCampaignRule(input: {
  campaign?: string;
  channelMarker?: string;
  inviteBindingEnabled: boolean;
}): ShareCampaignAttributionRule {
  const campaignClause = input.campaign ? `campaign ${input.campaign}` : "the default campaign";
  const channelClause = input.channelMarker ? `channel marker ${input.channelMarker}` : "the shared channel marker";
  return {
    ...(input.campaign ? { campaign: input.campaign } : {}),
    ...(input.channelMarker ? { channelMarker: input.channelMarker } : {}),
    inviteBindingEnabled: input.inviteBindingEnabled,
    conversionOutcomes: ["conversion"],
    ruleSummary: `Attribution binds ${campaignClause} to ${channelClause}; conversions are counted from recognized conversion returns.`,
  };
}

function createShareConversionEvidence(
  request: ShareReturnRecognitionRequest,
  conversionCount: number,
  now: string,
): ShareConversionEvidence {
  return {
    outcome: request.outcome,
    recognizedAt: now,
    ...(request.recognizedPath ? { recognizedPath: request.recognizedPath } : {}),
    ...(request.recognizedUserId ? { recognizedUserId: request.recognizedUserId } : {}),
    conversionCount,
    evidenceSummary:
      request.outcome === "conversion"
        ? `Conversion recognized at ${now}; total conversions are ${conversionCount}.`
        : `${request.outcome} recognized at ${now}; conversion count remains ${conversionCount}.`,
  };
}

function createShareProviderPosture(input: {
  providerMode: ProviderPostureMode;
  shortLinkProvider: string;
  posterProvider?: string;
  shortLink?: string;
  posterUrl?: string;
}): ShareProviderPosture {
  const shortLinkHost = resolveUrlHost(input.shortLink);
  const posterHost = resolveUrlHost(input.posterUrl);
  const readinessSummary =
    isProductionProviderMode(input.providerMode)
      ? `Share short-link provider ${input.shortLinkProvider} and poster provider ${input.posterProvider ?? "configured poster provider"} are configured. ${SECRET_MATERIAL_NOT_TRACKED_SUMMARY}`
      : `Share short-link and poster generation remain sample-backed through ${input.shortLinkProvider} and ${input.posterProvider ?? "sample-poster-provider"}. ${SECRET_MATERIAL_NOT_TRACKED_SUMMARY}`;
  return {
    providerMode: input.providerMode,
    shortLinkProvider: input.shortLinkProvider,
    ...(input.posterProvider ? { posterProvider: input.posterProvider } : {}),
    ...(shortLinkHost ? { shortLinkHost } : {}),
    ...(posterHost ? { posterHost } : {}),
    secretMaterialTracked: false,
    readinessSummary,
  };
}

function resolveShareProviderPosture(response: {
  shortLinkRecord?: { provider?: string; providerMode?: ProviderPostureMode; shortLink?: string };
  posterAsset?: { provider: string; providerMode?: ProviderPostureMode; url: string };
  providerPosture?: ShareProviderPosture;
}): ShareProviderPosture {
  if (response.providerPosture) {
    return response.providerPosture;
  }
  const providerMode = response.shortLinkRecord?.providerMode ?? response.posterAsset?.providerMode ?? "sample";
  return createShareProviderPosture({
    providerMode,
    shortLinkProvider: response.shortLinkRecord?.provider ?? "sample-short-link",
    ...(response.posterAsset?.provider ? { posterProvider: response.posterAsset.provider } : {}),
    ...(response.shortLinkRecord?.shortLink ? { shortLink: response.shortLinkRecord.shortLink } : {}),
    ...(response.posterAsset?.url ? { posterUrl: response.posterAsset.url } : {}),
  });
}

function createShortLinkReadinessSummary(provider: string, providerMode: ProviderPostureMode): string {
  return isProductionProviderMode(providerMode)
    ? `Short-link delivery is backed by ${provider}.`
    : `Short-link delivery remains sample-backed through ${provider}.`;
}

function createShortLinkDiagnosticsSummary(resolvedCount: number, lastResolvedAt?: string): string {
  return lastResolvedAt
    ? `Short-link has resolved ${resolvedCount} time${resolvedCount === 1 ? "" : "s"}, last at ${lastResolvedAt}.`
    : `Short-link has resolved ${resolvedCount} time${resolvedCount === 1 ? "" : "s"}.`;
}

function createPosterReadinessSummary(provider: string, providerMode: ProviderPostureMode): string {
  return isProductionProviderMode(providerMode)
    ? `Poster generation is backed by ${provider}.`
    : `Poster generation remains sample-backed through ${provider}.`;
}

function createPosterFallbackSummary(): string {
  return "Poster delivery can still fall back to copy-link or save-image behavior in the host runtime.";
}

export function createSharePrepareResponse(
  request: SharePrepareRequest,
  requestUrl: string,
  now = new Date().toISOString(),
  runtimeEnv?: ShareProviderRuntimeEnv,
): SharePrepareResponse {
  const attributionId = request.shareAttribution.attributionId ?? `share_${crypto.randomUUID()}`;
  const shortCode = attributionId.slice(-8);
  const providerMode = resolveShareProviderMode(runtimeEnv);
  const channelMarker =
    request.shareChannel.channelMarker ??
    request.sharePayload.channelMarker ??
    request.shareAttribution.channelMarker ??
    "minix-share";
  const landingPath = request.sharePayload.landingPath ?? "/login";
  const landingUrl = request.sharePayload.landingUrl ?? new URL(landingPath, requestUrl).toString();
  const shortLink = request.sharePayload.shortLink ?? buildShareShortLinkUrl(shortCode, requestUrl, runtimeEnv);
  const posterAsset =
    request.sharePayload.scenario === "poster" || request.shareChannel.kind === "poster_image"
      ? {
          assetId: `share_poster_${shortCode}`,
          provider: resolveSharePosterProvider(runtimeEnv),
          providerMode,
          url: resolveSharePosterAssetUrl(shortCode, requestUrl, runtimeEnv),
          createdAt: now,
          expiresAt: new Date(Date.parse(now) + 30 * 24 * 60 * 60 * 1000).toISOString(),
          readinessSummary: createPosterReadinessSummary(resolveSharePosterProvider(runtimeEnv), providerMode),
          fallbackSummary: createPosterFallbackSummary(),
        }
      : undefined;
  const shortLinkProvider = resolveShareShortLinkProvider(runtimeEnv);
  const shortLinkRecord = {
    attributionId,
    shortCode,
    shortLink,
    provider: shortLinkProvider,
    providerMode,
    landingPath,
    landingUrl,
    createdAt: now,
    resolvedCount: 0,
    readinessSummary: createShortLinkReadinessSummary(shortLinkProvider, providerMode),
    diagnosticsSummary: createShortLinkDiagnosticsSummary(0),
  };
  const providerPosture = createShareProviderPosture({
    providerMode,
    shortLinkProvider,
    ...(posterAsset?.provider ? { posterProvider: posterAsset.provider } : {}),
    shortLink,
    ...(posterAsset?.url ? { posterUrl: posterAsset.url } : {}),
  });

  const landingTarget = {
    ...(request.sharePayload.landingTarget?.routeId ? { routeId: request.sharePayload.landingTarget.routeId } : {}),
    path: landingPath,
    url: landingUrl,
    shortLink,
    shortCode,
    ...(request.sharePayload.landingTarget?.params ? { params: request.sharePayload.landingTarget.params } : {}),
    channelMarker,
    ...(request.redirectTarget ? { authRedirect: request.redirectTarget } : {}),
  };

  const shareAttribution = {
    ...request.shareAttribution,
    attributionId,
    channelMarker,
    returnFlowRecognized: false,
    shareCount: request.shareAttribution.shareCount + 1,
    clickCount: request.shareAttribution.clickCount,
    returnCount: request.shareAttribution.returnCount,
    conversionCount: request.shareAttribution.conversionCount,
    preparedAt: now,
    lastSharedAt: now,
    ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
    recognitionSummary: createShareRecognitionSummary(
      request.shareAttribution.shareCount + 1,
      request.shareAttribution.clickCount,
      request.shareAttribution.returnCount,
      request.shareAttribution.conversionCount,
    ),
    replaySummary: createShareReplaySummary(0),
    inviteBindingSummary: createInviteBindingSummary(request.shareAttribution.inviteBindingEnabled),
    campaignRule: createShareCampaignRule({
      channelMarker,
      inviteBindingEnabled: request.shareAttribution.inviteBindingEnabled,
      ...(request.sharePayload.trackingParams.campaign
        ? { campaign: request.sharePayload.trackingParams.campaign }
        : {}),
    }),
  };
  const attributionReport: ShareAttributionReport = {
    shareAttribution,
    shortLinkRecord,
    ...(posterAsset ? { posterAsset } : {}),
  };

  return {
    sharePayload: {
      ...request.sharePayload,
      landingPath,
      landingUrl,
      shortLink,
      ...(posterAsset ? { posterImageUrl: posterAsset.url } : {}),
      channelMarker,
      shareToken: attributionId,
      landingTarget,
      ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
      readinessSummary: createSharePayloadReadinessSummary({
        scenario: request.sharePayload.scenario,
        channelKind: request.shareChannel.kind,
        hasShortLink: true,
        hasPoster: Boolean(posterAsset),
      }),
    },
    shareChannel: {
      ...request.shareChannel,
      channelMarker,
      readinessSummary: createShareChannelReadinessSummary({
        channelKind: request.shareChannel.kind,
        providerMode,
        hasShortLink: true,
        hasPoster: Boolean(posterAsset),
      }),
      fallbackSummary: createShareFallbackSummary(request.shareChannel.kind),
    },
    shareAttribution,
    landingTarget,
    shortLinkRecord,
    ...(posterAsset ? { posterAsset } : {}),
    providerPosture,
    attributionReport,
  };
}

export function recognizeShareReturn(
  existing: SharePrepareResponse,
  request: ShareReturnRecognitionRequest,
  now = new Date().toISOString(),
): ShareReturnRecognitionResponse {
  const next = cloneDomainSnapshot(existing);
  next.shareAttribution.returnFlowRecognized = request.outcome === "return" || request.outcome === "conversion";
  if (request.outcome === "click") {
    next.shareAttribution.clickCount += 1;
    next.shareAttribution.lastClickAt = now;
  }
  if (request.outcome === "return" || request.outcome === "conversion") {
    next.shareAttribution.returnCount += 1;
    next.shareAttribution.lastReturnAt = now;
  }
  const lastLandingPath = request.recognizedPath ?? next.landingTarget.path;
  if (lastLandingPath) {
    next.shareAttribution.lastLandingPath = lastLandingPath;
  }
  if (request.outcome === "click" && next.shortLinkRecord) {
    next.shortLinkRecord.resolvedCount += 1;
    next.shortLinkRecord.lastResolvedAt = now;
  }

  if (request.outcome === "conversion") {
    next.shareAttribution.conversionCount += 1;
    next.shareAttribution.lastConversionAt = now;
    if (request.recognizedUserId) {
      next.shareAttribution.inviteBoundUserId = request.recognizedUserId;
    }
  }
  next.shareAttribution.conversionEvidence = createShareConversionEvidence(request, next.shareAttribution.conversionCount, now);

  next.sharePayload.readinessSummary = createSharePayloadReadinessSummary({
    scenario: next.sharePayload.scenario,
    channelKind: next.shareChannel.kind,
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.readinessSummary = createShareChannelReadinessSummary({
    channelKind: next.shareChannel.kind,
    providerMode: next.shortLinkRecord?.providerMode ?? next.posterAsset?.providerMode ?? "sample",
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.fallbackSummary = createShareFallbackSummary(next.shareChannel.kind);
  next.shareAttribution.recognitionSummary = createShareRecognitionSummary(
    next.shareAttribution.shareCount,
    next.shareAttribution.clickCount,
    next.shareAttribution.returnCount,
    next.shareAttribution.conversionCount,
  );
  next.shareAttribution.replaySummary = createShareReplaySummary(next.shortLinkRecord?.resolvedCount ?? 0);
  next.shareAttribution.inviteBindingSummary = createInviteBindingSummary(
    next.shareAttribution.inviteBindingEnabled,
    next.shareAttribution.inviteBoundUserId,
  );
  if (next.shortLinkRecord) {
    next.shortLinkRecord.readinessSummary = createShortLinkReadinessSummary(
      next.shortLinkRecord.provider ?? "sample-short-link",
      next.shortLinkRecord.providerMode ?? "sample",
    );
    next.shortLinkRecord.diagnosticsSummary = createShortLinkDiagnosticsSummary(
      next.shortLinkRecord.resolvedCount,
      next.shortLinkRecord.lastResolvedAt,
    );
  }
  if (next.posterAsset) {
    next.posterAsset.readinessSummary = createPosterReadinessSummary(
      next.posterAsset.provider,
      next.posterAsset.providerMode ?? "sample",
    );
    next.posterAsset.fallbackSummary = createPosterFallbackSummary();
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    landingTarget: next.landingTarget,
    ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
    ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    providerPosture: resolveShareProviderPosture(next),
    attributionReport: {
      shareAttribution: next.shareAttribution,
      ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}

export function resolveShareShortLink(
  existing: SharePrepareResponse,
  now = new Date().toISOString(),
): ShareShortLinkResolveResponse {
  const next = cloneDomainSnapshot(existing);
  const existingShortLinkRecord = next.shortLinkRecord ?? next.attributionReport.shortLinkRecord;
  if (next.shortLinkRecord) {
    next.shortLinkRecord.resolvedCount += 1;
    next.shortLinkRecord.lastResolvedAt = now;
  }
  next.shareAttribution.clickCount += 1;
  next.shareAttribution.lastClickAt = now;
  if (next.landingTarget.path) {
    next.shareAttribution.lastLandingPath = next.landingTarget.path;
  }
  next.sharePayload.readinessSummary = createSharePayloadReadinessSummary({
    scenario: next.sharePayload.scenario,
    channelKind: next.shareChannel.kind,
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.readinessSummary = createShareChannelReadinessSummary({
    channelKind: next.shareChannel.kind,
    providerMode: next.shortLinkRecord?.providerMode ?? next.posterAsset?.providerMode ?? "sample",
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.fallbackSummary = createShareFallbackSummary(next.shareChannel.kind);
  next.shareAttribution.recognitionSummary = createShareRecognitionSummary(
    next.shareAttribution.shareCount,
    next.shareAttribution.clickCount,
    next.shareAttribution.returnCount,
    next.shareAttribution.conversionCount,
  );
  next.shareAttribution.replaySummary = createShareReplaySummary((next.shortLinkRecord ?? existingShortLinkRecord)?.resolvedCount ?? 0);
  next.shareAttribution.inviteBindingSummary = createInviteBindingSummary(
    next.shareAttribution.inviteBindingEnabled,
    next.shareAttribution.inviteBoundUserId,
  );
  if (next.shortLinkRecord) {
    next.shortLinkRecord.readinessSummary = createShortLinkReadinessSummary(
      next.shortLinkRecord.provider ?? "sample-short-link",
      next.shortLinkRecord.providerMode ?? "sample",
    );
    next.shortLinkRecord.diagnosticsSummary = createShortLinkDiagnosticsSummary(
      next.shortLinkRecord.resolvedCount,
      next.shortLinkRecord.lastResolvedAt,
    );
  }
  if (next.posterAsset) {
    next.posterAsset.readinessSummary = createPosterReadinessSummary(
      next.posterAsset.provider,
      next.posterAsset.providerMode ?? "sample",
    );
    next.posterAsset.fallbackSummary = createPosterFallbackSummary();
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    landingTarget: next.landingTarget,
    shortLinkRecord:
      next.shortLinkRecord ?? {
        attributionId: next.shareAttribution.attributionId ?? next.sharePayload.shareToken ?? "share",
        shortCode: "share",
        shortLink: next.sharePayload.shortLink ?? next.landingTarget.shortLink ?? "",
        provider: existingShortLinkRecord?.provider ?? "sample-short-link",
        providerMode: existingShortLinkRecord?.providerMode ?? "sample",
        landingUrl: next.sharePayload.landingUrl ?? next.landingTarget.url ?? "",
        createdAt: now,
        resolvedCount: 1,
        lastResolvedAt: now,
      },
    ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    providerPosture: resolveShareProviderPosture(next),
    attributionReport: {
      shareAttribution: next.shareAttribution,
      shortLinkRecord:
        next.shortLinkRecord ?? {
          attributionId: next.shareAttribution.attributionId ?? next.sharePayload.shareToken ?? "share",
          shortCode: "share",
          shortLink: next.sharePayload.shortLink ?? next.landingTarget.shortLink ?? "",
          provider: existingShortLinkRecord?.provider ?? "sample-short-link",
          providerMode: existingShortLinkRecord?.providerMode ?? "sample",
          landingUrl: next.sharePayload.landingUrl ?? next.landingTarget.url ?? "",
          createdAt: now,
          resolvedCount: 1,
          lastResolvedAt: now,
        },
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}

export function createShareAttributionReport(existing: SharePrepareResponse): ShareAttributionReportResponse {
  const next = cloneDomainSnapshot(existing);
  next.sharePayload.readinessSummary = createSharePayloadReadinessSummary({
    scenario: next.sharePayload.scenario,
    channelKind: next.shareChannel.kind,
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.readinessSummary = createShareChannelReadinessSummary({
    channelKind: next.shareChannel.kind,
    providerMode: next.shortLinkRecord?.providerMode ?? next.posterAsset?.providerMode ?? "sample",
    hasShortLink: Boolean(next.shortLinkRecord ?? next.sharePayload.shortLink),
    hasPoster: Boolean(next.posterAsset ?? next.sharePayload.posterImageUrl),
  });
  next.shareChannel.fallbackSummary = createShareFallbackSummary(next.shareChannel.kind);
  next.shareAttribution.recognitionSummary = createShareRecognitionSummary(
    next.shareAttribution.shareCount,
    next.shareAttribution.clickCount,
    next.shareAttribution.returnCount,
    next.shareAttribution.conversionCount,
  );
  next.shareAttribution.replaySummary = createShareReplaySummary(next.shortLinkRecord?.resolvedCount ?? 0);
  next.shareAttribution.inviteBindingSummary = createInviteBindingSummary(
    next.shareAttribution.inviteBindingEnabled,
    next.shareAttribution.inviteBoundUserId,
  );
  if (next.shortLinkRecord) {
    next.shortLinkRecord.readinessSummary = createShortLinkReadinessSummary(
      next.shortLinkRecord.provider ?? "sample-short-link",
      next.shortLinkRecord.providerMode ?? "sample",
    );
    next.shortLinkRecord.diagnosticsSummary = createShortLinkDiagnosticsSummary(
      next.shortLinkRecord.resolvedCount,
      next.shortLinkRecord.lastResolvedAt,
    );
  }
  if (next.posterAsset) {
    next.posterAsset.readinessSummary = createPosterReadinessSummary(
      next.posterAsset.provider,
      next.posterAsset.providerMode ?? "sample",
    );
    next.posterAsset.fallbackSummary = createPosterFallbackSummary();
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    ...(next.landingTarget ? { landingTarget: next.landingTarget } : {}),
    ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
    ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    providerPosture: resolveShareProviderPosture(next),
    attributionReport: {
      shareAttribution: next.shareAttribution,
      ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}
