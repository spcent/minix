import type { AuthRedirectTarget } from "./auth";

export const SHARE_SCENARIOS = ["page", "content", "invite", "poster"] as const;
export type ShareScenario = (typeof SHARE_SCENARIOS)[number];

export const SHARE_CHANNEL_KINDS = [
  "wechat_session",
  "wechat_moments",
  "copy_link",
  "poster_image",
  "short_link",
] as const;
export type ShareChannelKind = (typeof SHARE_CHANNEL_KINDS)[number];

export const SHARE_RETURN_OUTCOMES = ["click", "return", "conversion"] as const;
export type ShareReturnOutcome = (typeof SHARE_RETURN_OUTCOMES)[number];

export interface ShareLandingTarget {
  routeId?: string;
  path?: string;
  url?: string;
  shortLink?: string;
  shortCode?: string;
  params?: Record<string, string | number | boolean>;
  channelMarker?: string;
  authRedirect?: AuthRedirectTarget;
}

export interface SharePayload {
  scenario: ShareScenario;
  title: string;
  summary?: string;
  coverUrl?: string;
  landingPath?: string;
  landingUrl?: string;
  shortLink?: string;
  posterImageUrl?: string;
  trackingParams: Record<string, string>;
  channelMarker?: string;
  contentId?: string;
  inviteCode?: string;
  shareToken?: string;
  landingTarget?: ShareLandingTarget;
  returnTarget?: AuthRedirectTarget;
}

export interface ShareChannel {
  kind: ShareChannelKind;
  label: string;
  executable: boolean;
  channelMarker?: string;
}

export interface ShareAttribution {
  attributionId?: string;
  channelMarker?: string;
  inviteBindingEnabled: boolean;
  returnFlowRecognized: boolean;
  shareCount: number;
  clickCount: number;
  returnCount: number;
  conversionCount: number;
  preparedAt?: string;
  lastSharedAt?: string;
  lastClickAt?: string;
  lastConversionAt?: string;
  lastReturnAt?: string;
  lastLandingPath?: string;
  inviteBoundUserId?: string;
  returnTarget?: AuthRedirectTarget;
}

export interface ShareShortLinkRecord {
  attributionId: string;
  shortCode: string;
  shortLink: string;
  provider?: string;
  providerMode?: "sample" | "production";
  landingPath?: string;
  landingUrl: string;
  createdAt: string;
  resolvedCount: number;
  lastResolvedAt?: string;
}

export interface SharePosterAsset {
  assetId: string;
  provider: string;
  providerMode?: "sample" | "production";
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ShareAttributionReport {
  shareAttribution: ShareAttribution;
  shortLinkRecord?: ShareShortLinkRecord;
  posterAsset?: SharePosterAsset;
}

export interface ShareDispatchRequest {
  sharePayload: SharePayload;
  shareChannel: ShareChannel;
  shareAttribution: ShareAttribution;
}

export interface ShareDispatchResult {
  sharePayload: SharePayload;
  shareChannel: ShareChannel;
  shareAttribution: ShareAttribution;
}

export interface SharePrepareRequest extends ShareDispatchRequest {
  redirectTarget?: AuthRedirectTarget;
}

export interface SharePrepareResponse extends ShareDispatchResult {
  landingTarget: ShareLandingTarget;
  shortLinkRecord?: ShareShortLinkRecord;
  posterAsset?: SharePosterAsset;
  attributionReport: ShareAttributionReport;
}

export interface ShareReturnRecognitionRequest {
  attributionId: string;
  outcome: ShareReturnOutcome;
  recognizedPath?: string;
  recognizedUserId?: string;
}

export interface ShareReturnRecognitionResponse extends ShareDispatchResult {
  landingTarget?: ShareLandingTarget;
  shortLinkRecord?: ShareShortLinkRecord;
  posterAsset?: SharePosterAsset;
  attributionReport: ShareAttributionReport;
}

export interface ShareShortLinkResolveRequest {
  attributionId?: string;
  shortCode?: string;
}

export interface ShareShortLinkResolveResponse extends ShareDispatchResult {
  landingTarget: ShareLandingTarget;
  shortLinkRecord: ShareShortLinkRecord;
  posterAsset?: SharePosterAsset;
  attributionReport: ShareAttributionReport;
}

export interface ShareAttributionReportRequest {
  attributionId: string;
}

export interface ShareAttributionReportResponse extends ShareDispatchResult {
  landingTarget?: ShareLandingTarget;
  shortLinkRecord?: ShareShortLinkRecord;
  posterAsset?: SharePosterAsset;
  attributionReport: ShareAttributionReport;
}
