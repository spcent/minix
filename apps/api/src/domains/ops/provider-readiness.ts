import type { ProviderPostureMode } from "@minix/contracts";

import type { ApiBindings } from "../../types";
import { isProductionProviderMode, isSampleProviderMode, resolveProviderPostureMode } from "../provider-posture";

export type ProviderReadinessStatus = "sample" | "ready" | "review" | "blocked";

export interface ProviderReadinessEntry {
  mode?: ProviderPostureMode;
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

export interface ProviderReadinessEnvironmentSummary {
  deployEnv: string;
  releasePosture: "sample" | "mixed" | "ready" | "blocked";
  comparableStatuses: Record<string, ProviderReadinessStatus>;
  readyCount: number;
  sampleCount: number;
  reviewCount: number;
  blockedCount: number;
  label: string;
}

export interface ProviderReadinessEvidencePack {
  capturedAt: string;
  deployEnv: string;
  releasePosture: "sample" | "mixed" | "ready" | "blocked";
  comparableStatuses: Record<string, ProviderReadinessStatus>;
  compareKey: string;
  label: string;
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
  const smsMode = resolveProviderPostureMode(env?.MINIX_AUTH_SMS_PROVIDER_MODE);
  const oauthMode = resolveProviderPostureMode(env?.MINIX_AUTH_OAUTH_PROVIDER_MODE);
  const messageMode = resolveProviderPostureMode(env?.MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE);
  const uploadMode = resolveProviderPostureMode(env?.MINIX_UPLOAD_PROVIDER_MODE);
  const shareMode = resolveProviderPostureMode(env?.MINIX_SHARE_PROVIDER_MODE);

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
  const messageDefaultedProductionChannels = isProductionProviderMode(messageMode) ? 4 - messageExplicitConfigs : 0;

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
          isSampleProviderMode(smsMode)
            ? "sample"
            : input.authSmsProviderConfigured
              ? "ready"
              : "blocked",
        detail:
          isSampleProviderMode(smsMode)
            ? "SMS verification remains in sample mode."
            : input.authSmsProviderConfigured
              ? "SMS production mode is enabled and a delivery adapter is wired."
              : "SMS production mode is enabled but no delivery adapter is wired.",
        adapterConfigured: input.authSmsProviderConfigured,
      },
      oauth: {
        mode: oauthMode,
        status:
          isSampleProviderMode(oauthMode)
            ? "sample"
            : input.authOAuthProviderConfigured
              ? "ready"
              : "blocked",
        detail:
          isSampleProviderMode(oauthMode)
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
          isSampleProviderMode(messageMode)
            ? "sample"
            : messageDefaultedProductionChannels === 0
              ? "ready"
              : "review",
        detail:
          isSampleProviderMode(messageMode)
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
          isSampleProviderMode(uploadMode)
            ? "sample"
            : uploadStorageProviderConfigured && uploadReviewProviderConfigured && uploadAssetBaseUrlConfigured
              ? "ready"
              : "review",
        detail:
          isSampleProviderMode(uploadMode)
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
          isSampleProviderMode(shareMode)
            ? "sample"
            : shareShortLinkProviderConfigured &&
                sharePosterProviderConfigured &&
                shareShortLinkBaseUrlConfigured &&
                sharePosterBaseUrlConfigured
              ? "ready"
              : "review",
        detail:
          isSampleProviderMode(shareMode)
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

function flattenProviderReadiness(summary: ProviderReadinessSummary): Record<string, ProviderReadinessStatus> {
  return {
    authSms: summary.auth.sms.status,
    authOauth: summary.auth.oauth.status,
    messagesTouchpoints: summary.messages.touchpoints.status,
    paymentCallbacks: summary.payment.callbacks.status,
    uploadPipeline: summary.upload.pipeline.status,
    shareDistribution: summary.share.distribution.status,
  };
}

export function createProviderReadinessEnvironmentSummary(
  summary: ProviderReadinessSummary,
  deployEnv?: string,
): ProviderReadinessEnvironmentSummary {
  const comparableStatuses = flattenProviderReadiness(summary);
  const values = Object.values(comparableStatuses);
  const blockedCount = values.filter((value) => value === "blocked").length;
  const reviewCount = values.filter((value) => value === "review").length;
  const readyCount = values.filter((value) => value === "ready").length;
  const sampleCount = values.filter((value) => value === "sample").length;
  const releasePosture =
    blockedCount > 0 ? "blocked" : reviewCount > 0 ? "mixed" : sampleCount === values.length ? "sample" : "ready";

  return {
    deployEnv: deployEnv ?? "local",
    releasePosture,
    comparableStatuses,
    readyCount,
    sampleCount,
    reviewCount,
    blockedCount,
    label:
      releasePosture === "blocked"
        ? "One or more provider-backed areas are blocked for the current deploy environment."
        : releasePosture === "mixed"
          ? "The current deploy environment mixes ready, sample, or review rollout posture."
          : releasePosture === "sample"
            ? "All provider-backed areas still run in sample posture for this deploy environment."
            : "All provider-backed areas expose repo-visible ready posture for this deploy environment.",
  };
}

export function createProviderReadinessEvidencePack(
  summary: ProviderReadinessSummary,
  input: {
    capturedAt: string;
    deployEnv?: string;
  },
): ProviderReadinessEvidencePack {
  const environmentSummary = createProviderReadinessEnvironmentSummary(summary, input.deployEnv);
  const compareKey = Object.entries(environmentSummary.comparableStatuses)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return {
    capturedAt: input.capturedAt,
    deployEnv: environmentSummary.deployEnv,
    releasePosture: environmentSummary.releasePosture,
    comparableStatuses: environmentSummary.comparableStatuses,
    compareKey,
    label: environmentSummary.label,
  };
}
