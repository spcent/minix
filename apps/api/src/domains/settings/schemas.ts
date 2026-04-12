import { z } from "zod";

export const settingsUpdateSchema = z.object({
  preferences: z
    .object({
      notificationsEnabled: z.boolean().optional(),
      device: z
        .object({
          networkStrategy: z.enum(["balanced", "wifi-first", "data-saver"]).optional(),
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
        channel: z.enum(["subscription_message", "sms", "email", "push"]),
        enabled: z.boolean().optional(),
        unsubscribed: z.boolean().optional(),
      }),
    )
    .optional(),
  privacyOptions: z
    .object({
      profileVisibility: z.enum(["signed_in_only", "followers_only", "public"]).optional(),
      personalizedRecommendations: z.boolean().optional(),
      searchHistoryEnabled: z.boolean().optional(),
      analyticsEnabled: z.boolean().optional(),
      screenshotFeedbackEnabled: z.boolean().optional(),
    })
    .optional(),
});
