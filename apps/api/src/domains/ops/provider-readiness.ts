import type { ApiBindings } from "../../types";

export type ProviderReadinessStatus = "sample" | "ready" | "review" | "blocked";

export interface ProviderReadinessEntry {
  mode?: "sample" | "production";
  status: ProviderReadinessStatus;
  detail: string;
}

export interface ProviderReadinessSummary {
  auth: {
    sms: ProviderReadinessEntry & {
      adapterConfigured: boolean;
    };
    oauth: ProviderReadinessEntry & {
      adapterConfigured: boolean;
    };
  };
  messages: {
    touchpoints: ProviderReadinessEntry & {
      explicitChannelConfigs: number;
      defaultedProductionChannels: number;
    };
  };
  payment: {
    callbacks: ProviderReadinessEntry & {
      webhookSecretConfigured: boolean;
    };
  };
  upload: {
    pipeline: ProviderReadinessEntry & {
      storageProviderConfigured: boolean;
      reviewProviderConfigured: boolean;
      assetBaseUrlConfigured: boolean;
    };
  };
  share: {
    distribution: ProviderReadinessEntry & {
      shortLinkProviderConfigured: boolean;
      posterProviderConfigured: boolean;
      shortLinkBaseUrlConfigured: boolean;
      posterBaseUrlConfigured: boolean;
    };
  };
}

function hasConfiguredString(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function createProviderReadinessSummary(input: {
  env?: ApiBindings;
  authSmsProviderConfigured: boolean;
  authOAuthProviderConfigured: boolean;
}): ProviderReadinessSummary {
  const { env } = input;
  const smsMode = env?.MINIX_AUTH_SMS_PROVIDER_MODE === "production" ? "production" : "sample";
  const oauthMode = env?.MINIX_AUTH_OAUTH_PROVIDER_MODE === "production" ? "production" : "sample";
  const messageMode = env?.MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE === "production" ? "production" : "sample";
  const uploadMode = env?.MINIX_UPLOAD_PROVIDER_MODE === "production" ? "production" : "sample";
  const shareMode = env?.MINIX_SHARE_PROVIDER_MODE === "production" ? "production" : "sample";

  const messageExplicitConfigs = [
    hasConfiguredString(env?.MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY) ||
      hasConfiguredString(env?.MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL),
    hasConfiguredString(env?.MINIX_MESSAGE_SMS_PROVIDER_KEY) ||
      hasConfiguredString(env?.MINIX_MESSAGE_SMS_PROVIDER_LABEL),
    hasConfiguredString(env?.MINIX_MESSAGE_EMAIL_PROVIDER_KEY) ||
      hasConfiguredString(env?.MINIX_MESSAGE_EMAIL_PROVIDER_LABEL),
    hasConfiguredString(env?.MINIX_MESSAGE_PUSH_PROVIDER_KEY) ||
      hasConfiguredString(env?.MINIX_MESSAGE_PUSH_PROVIDER_LABEL),
  ].filter(Boolean).length;
  const messageDefaultedProductionChannels = messageMode === "production" ? 4 - messageExplicitConfigs : 0;

  const webhookSecretConfigured = hasConfiguredString(env?.MINIX_PAYMENT_WEBHOOK_SECRET);
  const uploadStorageProviderConfigured = hasConfiguredString(env?.MINIX_UPLOAD_STORAGE_PROVIDER);
  const uploadReviewProviderConfigured = hasConfiguredString(env?.MINIX_UPLOAD_REVIEW_PROVIDER);
  const uploadAssetBaseUrlConfigured = hasConfiguredString(env?.MINIX_UPLOAD_ASSET_BASE_URL);
  const shareShortLinkProviderConfigured = hasConfiguredString(env?.MINIX_SHARE_SHORT_LINK_PROVIDER);
  const sharePosterProviderConfigured = hasConfiguredString(env?.MINIX_SHARE_POSTER_PROVIDER);
  const shareShortLinkBaseUrlConfigured = hasConfiguredString(env?.MINIX_SHARE_SHORT_LINK_BASE_URL);
  const sharePosterBaseUrlConfigured = hasConfiguredString(env?.MINIX_SHARE_POSTER_BASE_URL);

  return {
    auth: {
      sms: {
        mode: smsMode,
        status:
          smsMode === "sample"
            ? "sample"
            : input.authSmsProviderConfigured
              ? "ready"
              : "blocked",
        detail:
          smsMode === "sample"
            ? "SMS verification remains in sample mode."
            : input.authSmsProviderConfigured
              ? "SMS production mode is enabled and a delivery adapter is wired."
              : "SMS production mode is enabled but no delivery adapter is wired.",
        adapterConfigured: input.authSmsProviderConfigured,
      },
      oauth: {
        mode: oauthMode,
        status:
          oauthMode === "sample"
            ? "sample"
            : input.authOAuthProviderConfigured
              ? "ready"
              : "blocked",
        detail:
          oauthMode === "sample"
            ? "OAuth authorization and callback validation remain in sample mode."
            : input.authOAuthProviderConfigured
              ? "OAuth production mode is enabled and a provider adapter is wired."
              : "OAuth production mode is enabled but no provider adapter is wired.",
        adapterConfigured: input.authOAuthProviderConfigured,
      },
    },
    messages: {
      touchpoints: {
        mode: messageMode,
        status:
          messageMode === "sample"
            ? "sample"
            : messageDefaultedProductionChannels === 0
              ? "ready"
              : "review",
        detail:
          messageMode === "sample"
            ? "Message touchpoints remain in sample mode."
            : messageDefaultedProductionChannels === 0
              ? "Message touchpoints run in production mode with explicit provider configuration for all channels."
              : `Message touchpoints run in production mode, but ${messageDefaultedProductionChannels} channel(s) still use default provider metadata.`,
        explicitChannelConfigs: messageExplicitConfigs,
        defaultedProductionChannels: messageDefaultedProductionChannels,
      },
    },
    payment: {
      callbacks: {
        status: webhookSecretConfigured ? "ready" : "review",
        detail: webhookSecretConfigured
          ? "Payment callback verification secret is configured."
          : "Payment callback verification still relies on the local fallback secret.",
        webhookSecretConfigured,
      },
    },
    upload: {
      pipeline: {
        mode: uploadMode,
        status:
          uploadMode === "sample"
            ? "sample"
            : uploadStorageProviderConfigured && uploadReviewProviderConfigured && uploadAssetBaseUrlConfigured
              ? "ready"
              : "review",
        detail:
          uploadMode === "sample"
            ? "Upload review and storage remain in sample mode."
            : uploadStorageProviderConfigured && uploadReviewProviderConfigured && uploadAssetBaseUrlConfigured
              ? "Upload production mode has explicit storage, review, and asset-host configuration."
              : "Upload production mode is enabled, but storage, review, or asset-host configuration is still incomplete.",
        storageProviderConfigured: uploadStorageProviderConfigured,
        reviewProviderConfigured: uploadReviewProviderConfigured,
        assetBaseUrlConfigured: uploadAssetBaseUrlConfigured,
      },
    },
    share: {
      distribution: {
        mode: shareMode,
        status:
          shareMode === "sample"
            ? "sample"
            : shareShortLinkProviderConfigured &&
                sharePosterProviderConfigured &&
                shareShortLinkBaseUrlConfigured &&
                sharePosterBaseUrlConfigured
              ? "ready"
              : "review",
        detail:
          shareMode === "sample"
            ? "Share short-link and poster generation remain in sample mode."
            : shareShortLinkProviderConfigured &&
                sharePosterProviderConfigured &&
                shareShortLinkBaseUrlConfigured &&
                sharePosterBaseUrlConfigured
              ? "Share production mode has explicit short-link and poster configuration."
              : "Share production mode is enabled, but short-link, poster, or URL-host configuration is still incomplete.",
        shortLinkProviderConfigured: shareShortLinkProviderConfigured,
        posterProviderConfigured: sharePosterProviderConfigured,
        shortLinkBaseUrlConfigured: shareShortLinkBaseUrlConfigured,
        posterBaseUrlConfigured: sharePosterBaseUrlConfigured,
      },
    },
  };
}
