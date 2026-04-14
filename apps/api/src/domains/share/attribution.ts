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
        }
      : undefined;
  const shortLinkRecord = {
    attributionId,
    shortCode,
    shortLink,
    provider: resolveShareShortLinkProvider(runtimeEnv),
    providerMode,
    landingPath,
    landingUrl,
    createdAt: now,
    resolvedCount: 0,
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
    },
    shareChannel: {
      ...request.shareChannel,
      channelMarker,
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
  return {
    sharePayload: existing.sharePayload,
    shareChannel: existing.shareChannel,
    shareAttribution: existing.shareAttribution,
    ...(existing.landingTarget ? { landingTarget: existing.landingTarget } : {}),
    ...(existing.shortLinkRecord ? { shortLinkRecord: existing.shortLinkRecord } : {}),
    ...(existing.posterAsset ? { posterAsset: existing.posterAsset } : {}),
    attributionReport: {
      shareAttribution: existing.shareAttribution,
      ...(existing.shortLinkRecord ? { shortLinkRecord: existing.shortLinkRecord } : {}),
      ...(existing.posterAsset ? { posterAsset: existing.posterAsset } : {}),
    },
  };
}
