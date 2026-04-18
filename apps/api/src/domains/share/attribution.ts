import type {
  ShareAttributionReport,
  ShareAttributionReportResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  ShareShortLinkResolveResponse,
} from "@minix/contracts";

export interface ShareProviderRuntimeEnv {
  MINIX_SHARE_PROVIDER_MODE?: string;
  MINIX_SHARE_SHORT_LINK_PROVIDER?: string;
  MINIX_SHARE_POSTER_PROVIDER?: string;
  MINIX_SHARE_SHORT_LINK_BASE_URL?: string;
  MINIX_SHARE_POSTER_BASE_URL?: string;
}

function resolveShareProviderMode(runtimeEnv?: ShareProviderRuntimeEnv): "sample" | "production" {
  return runtimeEnv?.MINIX_SHARE_PROVIDER_MODE === "production" ? "production" : "sample";
}

function resolveShareShortLinkProvider(runtimeEnv?: ShareProviderRuntimeEnv): string {
  const provider = runtimeEnv?.MINIX_SHARE_SHORT_LINK_PROVIDER?.trim();
  if (provider) {
    return provider;
  }

  return resolveShareProviderMode(runtimeEnv) === "production" ? "configured-short-link-provider" : "sample-short-link";
}

function resolveSharePosterProvider(runtimeEnv?: ShareProviderRuntimeEnv): string {
  const provider = runtimeEnv?.MINIX_SHARE_POSTER_PROVIDER?.trim();
  if (provider) {
    return provider;
  }

  return resolveShareProviderMode(runtimeEnv) === "production" ? "configured-poster-provider" : "sample-poster-provider";
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

const buildShareShortLinkUrl = (
  shortCode: string,
  requestUrl: string,
  runtimeEnv?: ShareProviderRuntimeEnv,
): string => {
  const configuredBaseUrl = runtimeEnv?.MINIX_SHARE_SHORT_LINK_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return new URL(shortCode, normalizeBaseUrl(configuredBaseUrl)).toString();
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
    return new URL(`${shortCode}.svg`, normalizeBaseUrl(configuredBaseUrl)).toString();
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
  providerMode: "sample" | "production";
  hasShortLink: boolean;
  hasPoster: boolean;
}): string {
  const providerClause =
    input.providerMode === "production"
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

function createShortLinkReadinessSummary(provider: string, providerMode: "sample" | "production"): string {
  return providerMode === "production"
    ? `Short-link delivery is backed by ${provider}.`
    : `Short-link delivery remains sample-backed through ${provider}.`;
}

function createShortLinkDiagnosticsSummary(resolvedCount: number, lastResolvedAt?: string): string {
  return lastResolvedAt
    ? `Short-link has resolved ${resolvedCount} time${resolvedCount === 1 ? "" : "s"}, last at ${lastResolvedAt}.`
    : `Short-link has resolved ${resolvedCount} time${resolvedCount === 1 ? "" : "s"}.`;
}

function createPosterReadinessSummary(provider: string, providerMode: "sample" | "production"): string {
  return providerMode === "production"
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
    attributionReport,
  };
}

export function recognizeShareReturn(
  existing: SharePrepareResponse,
  request: ShareReturnRecognitionRequest,
  now = new Date().toISOString(),
): ShareReturnRecognitionResponse {
  const next = structuredClone(existing);
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
  const next = structuredClone(existing);
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
  const next = structuredClone(existing);
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
    attributionReport: {
      shareAttribution: next.shareAttribution,
      ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}
