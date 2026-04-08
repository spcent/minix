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
}

export interface ShareChannel {
  kind: ShareChannelKind;
  label: string;
  executable: boolean;
  channelMarker?: string;
}

export interface ShareAttribution {
  channelMarker?: string;
  inviteBindingEnabled: boolean;
  returnFlowRecognized: boolean;
  shareCount: number;
  clickCount: number;
  conversionCount: number;
  lastSharedAt?: string;
  lastClickAt?: string;
  lastConversionAt?: string;
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
