import { SETTINGS_NETWORK_STRATEGIES, SETTINGS_NOTIFICATION_CHANNELS, SETTINGS_PROFILE_VISIBILITIES } from "@minix/contracts";
import { z } from "zod";

export const settingsUpdateSchema = z.object({
  preferences: z
    .object({
      notificationsEnabled: z.boolean().optional(),
      device: z
        .object({
          networkStrategy: z.enum(SETTINGS_NETWORK_STRATEGIES).optional(),
          autoplay: z.boolean().optional(),
          weakNetworkMode: z.boolean().optional(),
        })
        .optional(),
      developerOptions: z
        .object({
          logsEnabled: z.boolean().optional(),
          experimentsEnabled: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  featureToggles: z
    .object({
      pushEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    })
    .optional(),
  notificationChannels: z
    .array(
      z.object({
        channel: z.enum(SETTINGS_NOTIFICATION_CHANNELS),
        enabled: z.boolean().optional(),
        unsubscribed: z.boolean().optional(),
      }),
    )
    .optional(),
  privacyOptions: z
    .object({
      profileVisibility: z.enum(SETTINGS_PROFILE_VISIBILITIES).optional(),
      personalizedRecommendations: z.boolean().optional(),
      searchHistoryEnabled: z.boolean().optional(),
      analyticsEnabled: z.boolean().optional(),
      screenshotFeedbackEnabled: z.boolean().optional(),
    })
    .optional(),
});
